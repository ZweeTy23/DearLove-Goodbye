const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

// Initialize Supabase Client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const musicDir = path.join(__dirname, '..', 'public', 'assets', 'musica');
  if (!fs.existsSync(musicDir)) {
    console.error(`Error: music directory not found at: ${musicDir}`);
    process.exit(1);
  }

  console.log('--- EOA Supabase Music Uploader (Hex Encoded) ---');
  console.log('Connecting to Supabase...');

  // 1. Ensure the bucket 'musica' exists
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error('Error fetching buckets:', bucketError.message);
    process.exit(1);
  }

  const musicBucketExists = buckets.some(b => b.name === 'musica');
  if (!musicBucketExists) {
    console.log('Storage bucket "musica" not found. Attempting to create it...');
    const { error: createBucketError } = await supabase.storage.createBucket('musica', {
      public: true
    });
    if (createBucketError) {
      console.error('Failed to create "musica" bucket.');
      console.error(createBucketError.message);
      process.exit(1);
    }
    console.log('Bucket "musica" created successfully.');
  } else {
    console.log('Verified: storage bucket "musica" exists.');
  }

  // 2. Fetch already uploaded music to skip duplicates
  console.log('Listing already uploaded music in storage bucket...');
  const { data: existingFiles, error: listError } = await supabase.storage.from('musica').list('', { limit: 1000 });
  if (listError) {
    console.error('Error listing storage objects:', listError.message);
    process.exit(1);
  }

  // Parse existing files from hex to display names
  const uploadedFilesSet = new Set();
  existingFiles.forEach(f => {
    try {
      const hexName = f.name.replace(/\.mp3$/, "");
      const decoded = Buffer.from(hexName, 'hex').toString('utf8');
      uploadedFilesSet.add(decoded);
    } catch {
      uploadedFilesSet.add(f.name);
    }
  });
  console.log(`Bucket has ${uploadedFilesSet.size} music tracks registered.`);

  // 3. Scan the music directory
  console.log(`Scanning directory: ${musicDir}...`);
  const files = fs.readdirSync(musicDir).filter(
    file => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg')
  );

  console.log(`Found ${files.length} total music files locally.`);

  // 4. Process and upload in parallel
  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const CONCURRENCY_LIMIT = 5;
  const queue = [...files];
  const activeUploads = [];

  const uploadFile = async (file) => {
    if (uploadedFilesSet.has(file)) {
      skippedCount++;
      return;
    }

    const filePath = path.join(musicDir, file);
    const fileStats = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    // Convert filename to Hex to evade Supabase Special Character / Space Storage Restrictions
    const safeKey = Buffer.from(file).toString('hex') + '.mp3';

    console.log(`Uploading ${file} as ${safeKey} (${(fileStats.size / (1024 * 1024)).toFixed(2)} MB)...`);

    try {
      const { error: uploadError } = await supabase.storage
        .from('musica')
        .upload(safeKey, fileBuffer, {
          contentType: 'audio/mpeg',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }
      uploadedCount++;
      console.log(`✓ Uploaded ${file} successfully!`);
    } catch (err) {
      console.error(`✗ Error uploading ${file}:`, err.message);
      errorCount++;
    }
  };

  const processQueue = async () => {
    const promises = [];
    while (queue.length > 0 && activeUploads.length < CONCURRENCY_LIMIT) {
      const file = queue.shift();
      const promise = uploadFile(file).then(() => {
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

  console.log('\n--- Music Upload Process Completed ---');
  console.log(`Total processed: ${files.length}`);
  console.log(`Newly uploaded:  ${uploadedCount}`);
  console.log(`Already uploaded (skipped): ${skippedCount}`);
  console.log(`Errors encountered: ${errorCount}`);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
