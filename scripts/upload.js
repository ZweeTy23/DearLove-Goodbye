const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const heicConvert = require('heic-convert');

// Helper to parse env variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found at the project root.');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Missing environment variables in .env.local.');
  console.error('Make sure you have:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=... (Must use the service_role secret key to bypass RLS and write to storage)');
  process.exit(1);
}

// Initialize Supabase Client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Parse date from filename with regex patterns
function parseCapturedDate(filename, fileStats) {
  // Format 1: IMG-20250617-WA0028.jpeg or VID-20250820-WA0088.mp4
  const format1 = /(?:IMG|VID)-(\d{4})(\d{2})(\d{2})-WA/i.exec(filename);
  if (format1) {
    return new Date(`${format1[1]}-${format1[2]}-${format1[3]}T12:00:00Z`);
  }

  // Format 2: IMG20250915134451.heic or VID20250915131305.mp4
  const format2 = /(?:IMG|VID)(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/i.exec(filename);
  if (format2) {
    return new Date(`${format2[1]}-${format2[2]}-${format2[3]}T${format2[4]}:${format2[5]}:${format2[6]}Z`);
  }

  // Format 3: IMG_20250821_182954_0325.jpg or VID_20251101_115512_798.mp4
  const format3 = /(?:IMG|VID)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/i.exec(filename);
  if (format3) {
    return new Date(`${format3[1]}-${format3[2]}-${format3[3]}T${format3[4]}:${format3[5]}:${format3[6]}Z`);
  }

  // Format 4: Screenshot_2026-01-21-22-45-26-13...
  const format4 = /Screenshot_(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/i.exec(filename);
  if (format4) {
    return new Date(`${format4[1]}-${format4[2]}-${format4[3]}T${format4[4]}:${format4[5]}:${format4[6]}Z`);
  }

  // Format 5: Unix timestamp 1765931467225.jpg (13 digits)
  const format5 = /^(\d{13})\./.exec(filename);
  if (format5) {
    return new Date(parseInt(format5[1], 10));
  }

  // Fallback to file creation/modified date
  return fileStats.mtime || new Date();
}

async function main() {
  const fotosDir = path.join(__dirname, '..', 'public', 'assets', 'fotos');
  if (!fs.existsSync(fotosDir)) {
    console.error(`Error: fotos directory not found at: ${fotosDir}`);
    process.exit(1);
  }

  console.log('--- EOA Supabase Media Uploader ---');
  console.log('Connecting to Supabase...');

  // 1. Ensure the bucket 'media' exists
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error('Error fetching buckets:', bucketError.message);
    process.exit(1);
  }

  const mediaBucketExists = buckets.some(b => b.name === 'media');
  if (!mediaBucketExists) {
    console.log('Storage bucket "media" not found. Attempting to create it...');
    const { error: createBucketError } = await supabase.storage.createBucket('media', {
      public: true
    });
    if (createBucketError) {
      console.error('Failed to create "media" bucket. Please check policies or create it manually in the Supabase Dashboard.');
      console.error(createBucketError.message);
      process.exit(1);
    }
    console.log('Bucket "media" created successfully.');
  } else {
    console.log('Verified: storage bucket "media" exists.');
  }

  // 2. Fetch already uploaded media to make the script idempotent (allows resuming)
  console.log('Fetching already uploaded media from database to skip duplicates...');
  const { data: existingMedia, error: dbFetchError } = await supabase
    .from('media')
    .select('bucket_path');

  if (dbFetchError) {
    console.error('Error querying database. Ensure you have run the database schema SQL script on your Supabase project.');
    console.error(dbFetchError.message);
    process.exit(1);
  }

  const uploadedPathsSet = new Set(existingMedia.map(m => m.bucket_path));
  console.log(`Database has ${uploadedPathsSet.size} items registered.`);

  // 3. Scan the fotos directory
  console.log(`Scanning directory: ${fotosDir}...`);
  const files = fs.readdirSync(fotosDir);
  const mediaFiles = [];

  const allowedExtensions = {
    // Images
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.webp': 'image',
    '.heic': 'image',
    // Videos
    '.mp4': 'video',
    '.mov': 'video',
    '.webm': 'video',
    '.avi': 'video'
  };

  for (const filename of files) {
    const filePath = path.join(fotosDir, filename);
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) continue;

    const ext = path.extname(filename).toLowerCase();
    if (allowedExtensions[ext]) {
      mediaFiles.push({
        filename,
        filePath,
        ext,
        stats,
        mediaType: allowedExtensions[ext]
      });
    }
  }

  console.log(`Found ${mediaFiles.length} total media files in directory.`);

  // 4. Process and upload
  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // We upload with a concurrency limit of 5 to speed things up without overloading the network/Supabase rate limits.
  const CONCURRENCY_LIMIT = 5;
  const queue = [...mediaFiles];
  const activeUploads = [];

  const uploadFile = async (item) => {
    let finalFilename = item.filename;
    let finalExt = item.ext;

    if (item.ext === '.heic') {
      finalFilename = item.filename.replace(/\.heic$/i, '.jpg');
      finalExt = '.jpg';
    }

    const bucketPath = finalFilename; // Keep it simple: filename is the path

    // Skip if already uploaded
    if (uploadedPathsSet.has(bucketPath)) {
      skippedCount++;
      return;
    }

    let fileBuffer;
    let contentType;

    // Convert HEIC to JPG
    if (item.ext === '.heic') {
      try {
        console.log(`[HEIC] Converting ${item.filename} to JPEG...`);
        const heicBuffer = fs.readFileSync(item.filePath);
        const jpgBuffer = await heicConvert({
          buffer: heicBuffer,
          format: 'JPEG',
          quality: 0.9 // Very high quality
        });
        
        fileBuffer = jpgBuffer;
        contentType = 'image/jpeg';
        console.log(`[HEIC] Successfully converted ${item.filename} -> ${finalFilename}`);
      } catch (err) {
        console.error(`[HEIC ERROR] Failed to convert ${item.filename}:`, err.message);
        errorCount++;
        return;
      }
    } else {
      fileBuffer = fs.readFileSync(item.filePath);
      contentType = item.mediaType === 'image' ? `image/${finalExt.slice(1)}` : `video/${finalExt.slice(1)}`;
      if (finalExt === '.jpg' || finalExt === '.jpeg') contentType = 'image/jpeg';
    }

    console.log(`Uploading [${item.mediaType.toUpperCase()}] ${finalFilename} (${(item.stats.size / (1024 * 1024)).toFixed(2)} MB)...`);

    try {
      // A. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(bucketPath, fileBuffer, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Storage error: ${uploadError.message}`);
      }

      // B. Get Public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(bucketPath);

      const publicUrl = urlData.publicUrl;

      // C. Insert into media table
      const capturedDate = parseCapturedDate(item.filename, item.stats);

      const { error: dbError } = await supabase
        .from('media')
        .insert({
          name: finalFilename,
          url: publicUrl,
          type: item.mediaType,
          size: item.stats.size,
          captured_at: capturedDate.toISOString(),
          bucket_path: bucketPath
        });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      uploadedCount++;
      console.log(`✓ Uploaded ${finalFilename} successfully!`);
    } catch (err) {
      console.error(`✗ Error uploading ${finalFilename}:`, err.message);
      errorCount++;
    }
  };

  const processQueue = async () => {
    const promises = [];
    while (queue.length > 0 && activeUploads.length < CONCURRENCY_LIMIT) {
      const item = queue.shift();
      const promise = uploadFile(item).then(() => {
        // Remove from active uploads
        activeUploads.splice(activeUploads.indexOf(promise), 1);
      });
      activeUploads.push(promise);
      promises.push(promise);
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
      await processQueue();
    }
  };

  await processQueue();

  console.log('\n--- Upload Process Completed ---');
  console.log(`Total processed: ${mediaFiles.length}`);
  console.log(`Newly uploaded:  ${uploadedCount}`);
  console.log(`Already uploaded (skipped): ${skippedCount}`);
  console.log(`Errors encountered: ${errorCount}`);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
