"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface WrittenItem {
  id: string;
  title: string;
  content: string;
  type: "acrostic" | "poem" | "story";
}

const staticAcrostics = [
  {
    title: "1. Destino",
    content: "Desde el instante en que cruzamos la mirada,\nAprendió mi alma lo que es la luz del día.\nLejos del ruido, tu voz es la alborada,\nAnclado en tu pecho encuentro mi guía,\nInmensamente feliz, con mi mano en la tuya enlazada."
  },
  {
    title: "2. Universo en tu nombre",
    content: "Descubrir el mundo a través de tus ojos,\nAgradecer cada risa y cada segundo juntos,\nLlenar las horas borrando los antojos,\nAmándote en silencio, uniendo nuestros puntos,\nIluminando el camino sin miedos ni cerrojos."
  },
  {
    title: "3. Refugio",
    content: "Dulce refugio que el tiempo me ha dado,\nAliento constante que borra el invierno.\nLatinoamérica entera se rinde al pasado,\nAnte este presente que se siente eterno,\nInstante perfecto si estás a mi lado."
  },
  {
    title: "4. Esencia",
    content: "Dibujas la calma en mitad de la tormenta,\nAbrazas mis sombras con hilos de sol.\nLa vida contigo mil veces se inventa,\nAroma a futuro, a fuego y crisol,\nIncreíble misterio que mi alma alimenta."
  },
  {
    title: "5. Promesa",
    content: "Dame la mano y miremos el mapa,\nA donde tú vayas, allá es mi destino.\nLa magia del tiempo contigo no escapa,\nAmor que se vuelve perfecto camino,\nInicio y final de mi mejor etapa."
  }
];

const staticPoems = [
  {
    title: "6. La física de los dos",
    content: "No hacen falta palabras complicadas\npara entender que somos el compás perfecto,\ndos almas que se encuentran alineadas\nborrando del espacio cualquier defecto.\n\nEl mundo afuera sigue su ruidoso viaje,\nla prisa de la gente no se quiere detener,\npero nosotros compartimos otro paisaje\ndonde lo único importante es vernos crecer.\n\nMe gusta descifrar la calma de tu rostro\ncuando el silencio se apodera de la habitación,\nsaber que ante tus ojos yo jamás me postro,\nporque caminamos juntos en la misma dirección.\n\nY así pasan las horas, los días y los meses,\ncon la certeza de que el hilo no se va a romper,\nrepartiendo la alegría que tú me ofreces\nen cada bendito instante de cada amanecer."
  },
  {
    title: "7. El faro de la rutina",
    content: "Cuando la tormenta agita el mar de la rutina\ny el horizonte se vuelve gris y borroso,\ntu presencia es la luz que a lo lejos ilumina\nel puerto más seguro, el rincón más hermoso.\n\nNo hay viento que mueva los cimientos que creamos,\nni noche tan oscura que nos pueda asustar,\nporque en el mapa secreto que los dos trazamos\nsiempre hay un camino que nos vuelve a juntar.\n\nEs la magia discreta de las cosas pequeñas,\ncomo un café compartido antes de empezar,\nla complicidad de entender lo que sueñas\ncon solo ver la forma en que sueles mirar.\n\nPor eso te elijo cuando el cielo se complica\ny el ruido del asfalto se vuelve una prisión,\ntu abrazo es el lenguaje que todo lo explica,\nel refugio perfecto de mi corazón."
  },
  {
    title: "8. Arquitectura del alma",
    content: "Construimos un puente que nadie puede romper\ncon vigas de confianza y ladrillos de miradas,\nun espacio propio donde ver el sol nacer\ncon las defensas bajas y las almas desarmadas.\n\nNo nos importan las leyes de la gravedad\ncuando flotamos libres en nuestra complicidad,\ndejando que el tiempo corra con velocidad\nmientras cuidamos juntos nuestra propia verdad.\n\nHay una línea clara entre el antes y el después,\nun trazo firme que tu mano dibujó en mi ser,\nponiendo la cordura directo bajo mis pies\ny dándome los ojos que hacían falta para ver.\n\nEsta es la estructura que decidimos levantar,\nlejos de la tormenta y de cualquier dolor,\nun santuario eterno donde podemos habitar\nbajo las suaves reglas que dicta tu amor."
  },
  {
    title: "9. El idioma de las miradas",
    content: "Me gusta cuando nos quedamos en total silencio\ny el mundo alrededor parece perder el valor,\nes en esos segundos donde yo presencio\nla calma más pura de tu interno esplendor.\n\nNo hacen falta discursos ni grandes promesas\npara saber que estamos en el mismo andén,\ntú espantas mis dudas, mis miedos alejas,\nhaciendo que los días difíciles marchen bien.\n\nTus ojos me cuentan historias sin hablar,\nme dicen que el futuro no tiene por qué asustar\nsi mantenemos las ganas de volver a intentar\ncualquier proyecto loco que queramos empezar.\n\nAsí se escribe el código de nuestra realidad,\ncon gestos invisibles que nadie más comprende,\nun pacto sin firmas colmado de honestidad\nque con el paso del tiempo más fuerte se enciende."
  },
  {
    title: "10. Presente absoluto",
    content: "No te amo por las glorias del pasado ayer\nni por las incertidumbres que el destino guarde,\nte amo en el espacio que puedo sostener\nmientras vemos cómo se tiñe de oro la tarde.\n\nEl segundero corre sin pedirnos permiso\npero contigo el tiempo cambia su velocidad,\nconvirtiendo el suelo en un tierno paraíso\ndonde la rutina se transforma en libertad.\n\nMe basta con saber que estás aquí conmigo\ncompartiendo los planes, la risa y la canción,\nsiendo mi soporte, mi pareja y mi amigo,\nla brújula constante de mi dirección.\n\nPor eso disfruto el presente que me entregas,\nsin prisas absurdas que nos quieran empujar,\nsé que a mi lado con paso firme navegas\nen este dulce viaje que no va a terminar."
  },
  {
    title: "11. Geografía compartida",
    content: "De todas las ciudades y de todos los rincones,\nde tantos caminos que pudimos caminar,\nel destino ignoró las lógicas razones\ny nos puso de frente para podernos amar.\n\nNo creo en el azar pero creo en tu mirada,\nen la forma perfecta en que encaja tu mano,\nen cómo de pronto la noche se ve iluminada\ncon un sentimiento que ya no se siente en vano.\n\nTrazamos un mapa que no conoce de fronteras,\ndonde los chistes internos son la capital,\nborrando del calendario las frías esperas\npara darle paso a una primavera sin final.\n\nQué suerte la mía coincidir en este plano,\ncompartir los mismos gustos y la misma fe,\nsaber que el universo no trabaja en vano\ncuando te puso en mi vida y todo lo cambió de pie."
  },
  {
    title: "12. Alquimia diaria",
    content: "Transformas el día gris en un lienzo brillante\ncon solo una sonrisa al verme regresar,\nes una magia sutil, discreta pero constante\nque ninguna tormenta del suelo puede arrancar.\n\nHaces que lo corriente se vuelva extraordinario,\nque los problemas pierdan su amargo sabor,\nescribiendo una página nueva en el diario\ndonde el tema principal siempre es tu amor.\n\nMe enseñas a ver el mundo sin tanto escudo,\na soltar las cargas que no debo llevar,\ndesatando con paciencia cada viejo nudo\nque el pasado en mi mente se atrevió a dejar.\n\nEres la física simple que todo lo acomoda,\nel equilibrio justo entre la fuerza y la paz,\nun sentimiento puro que nunca pasa de moda\ny que me demuestra de todo lo que eres capaz."
  },
  {
    title: "13. El café de las mañanas",
    content: "Hasta el café de la mañana sabe diferente\nsi estás del otro lado mirándome sonreír,\nel calor de tu presencia se siente caliente\ndejando claro que a tu lado quiero vivir.\n\nLa rutina se vuelve una danza muy bonita\ncuando dividimos las tareas del hogar,\ntu voz es la melodía que el pecho necesita\npara que el cansancio no nos pueda alcanzar.\n\nMe gusta ver cómo te concentras en tus cosas,\nel brillo de tus ojos cuando hablas con pasión,\nconvirtiendo las horas comunes en valiosas\nmientras le pones a cada detalle el corazón.\n\nEs en esos momentos donde todo se resume,\nlejos de los lujos o la gran celebración,\nel aroma de tu risa es el mejor perfume\nque mantiene encendida nuestra conexión."
  },
  {
    title: "14. Brújula de papel",
    content: "Si alguna vez me pierdo en mitad del laberinto\ny las dudas me intentan el paso detener,\nsé que tu recuerdo me dará un rumbo distinto\npara encontrar la fuerza que necesito tener.\n\nPorque este amor no se rompe con la distancia\nni se desgasta con el roce de la realidad,\nmantiene intacta su más pura fragancia\nbasado en el respeto y en la honestidad.\n\nEres el norte claro en mi mapa de papel,\nel punto de retorno al que quiero volver,\nno importa si el camino se pone amargo o hiel\nsé que con tu apoyo todo lo podré vencer.\n\nGuardamos los secretos de nuestra propia historia\nen una caja fuerte que nadie puede abrir,\ndejando tu nombre grabado en mi memoria\ncomo el motivo exacto que me hace sonreír."
  },
  {
    title: "15. Raíces profundas",
    content: "Este amor no es una flor de un solo día\nque se marchita cuando el sol empieza a quemar,\ntiene raíces fuertes de constante alegría\nque en lo profundo de la tierra se saben quedar.\n\nCrecemos despacio, regando el sentimiento\ncon la paciencia de quien sabe esperar,\nsin dejarnos llevar por el frío del viento\nni por las modas que suelen pasar.\n\nHay una base sólida en lo que construimos,\nhecha de pláticas largas a media noche,\nde los errores que juntos ya corregimos\ny de un cariño que no conoce el reproche.\n\nPor eso el futuro se ve tan despejado\ncuando miro el horizonte y te veo ahí,\nsabiendo que pase lo que pase a mi lado\nyo seré muy feliz si te tengo a ti."
  },
  {
    title: "16. El espejo del alma",
    content: "En el espejo de tu alma me gusta mirarme\nporque me devuelves una versión mucho mejor,\nme enseñas el camino sin intentar cambiarme\ny curas mis heridas con infinito amor.\n\nTu aceptación es el regalo más gigante\nque alguien en la vida me pudo entregar,\nun faro encendido que camina adelante\npara mostrarme cómo debo avanzar.\n\nAprendo de tu fuerza, de tu forma de ser,\nde la ternura que pones en cada acción,\ny siento que contigo nada puedo perder\nporque me entregas entera tu protección.\n\nReflejados en el tiempo seguiremos los dos,\nescribiendo los versos de nuestra verdad,\ndejando a los viejos fantasmas adiós\npara vivir el presente con total libertad."
  },
  {
    title: "17. Código secreto",
    content: "Hay un lenguaje que solo nosotros sabemos\nhecho de gestos, miradas y complicidad,\nun camino privado que juntos corremos\ndonde no tiene espacio la falsa piedad.\n\nNos basta una mueca para estallar de risa\nen medio de una sala llena de gente,\ncorriendo por la vida sin ninguna prisa\npero manteniendo el cariño muy presente.\n\nSon las canciones compartidas en el auto,\nlos memes guardados para hacerte feliz,\nel ritmo de un amor que nunca va de cauto\nporque prefiere pintar de color el gris.\n\nEste sistema nuestro no tiene fallas,\nfunciona con la energía de la honestidad,\nrompiendo por completo todas las murallas\npara entregarnos mutua y plena libertad."
  },
  {
    title: "18. El abrigo del mundo",
    content: "El mundo allá afuera puede ser muy distante,\nuna masa de prisa, de ruido y de frío,\npero entrar en tu abrazo, aunque sea un instante,\nes llenar por completo todo mi vacío.\n\nTu pecho es el escudo contra la tormenta,\nel lugar donde el ruido deja de sonar,\ndonde la calma del alma se incrementa\ny el cansancio por fin se puede marchar.\n\nNo importa lo difícil que se ponga la jornada\nni los retos que el trabajo nos quiera poner,\nsé que al final de la tarde veré tu mirada\ny todo lo malo va a desaparecer.\n\nEres el abrigo que me protege del viento,\nla manta cálida en las noches de invierno,\nel recordatorio de este gran sentimiento\nque empezó como un sueño y se siente eterno."
  },
  {
    title: "19. Descalzos sobre el pasto",
    content: "Amarte es como caminar descalzo sobre el pasto,\nsin escudos, sin poses, con total libertad,\nun sentimiento limpio, transparente y vasto\nque no necesita fingir ninguna verdad.\n\nDejamos en la puerta las máscaras diarias\nque la sociedad nos obliga a utilizar,\npara tener esas pláticas extraordinarias\nque solo contigo me atrevo a desatar.\n\nEs la belleza de vernos tal como somos,\ncon los defectos y las virtudes por igual,\nsin importar los títulos ni los diplomas\nen este rincón que se siente tan natural.\n\nAsí se fortalece lo que por ti yo siento,\nlejos de la apariencia y de la vanidad,\nun lazo de verdad que resiste al viento\ny se alimenta siempre de la honestidad."
  },
  {
    title: "20. El mejor paisaje del mundo",
    content: "He visto paisajes que quitan el aliento,\natardeceres de fuego sobre el ancho mar,\npero ninguno supera el dulce momento\nen que tus ojos claros me vuelven a mirar.\n\nNo hay obra de arte que se le compare\na la curva perfecta que forma tu sonrisa,\npor más que el mundo sus tesoros me prepare\nyo prefiero tu compañía y tu brisa.\n\nEres la estética que mi mente prefiere,\nel diseño perfecto que la vida me dio,\nlo que mi corazón verdaderamente quiere\ndesde el primer instante en que te vio.\n\nMe quedo contigo en cualquier escenario,\nya sea en la playa o en la gran ciudad,\nporque tu presencia es el único santuario\ndonde encuentro la verdadera felicidad."
  },
  {
    title: "21. Sin prisa por llegar",
    content: "Vamos despacio, disfrutando del camino,\nescribiendo la historia renglón por renglón,\nno nos urge llegar al final del destino\nnos basta el latido de un mismo corazón.\n\nCada etapa tiene su propia belleza,\nsus propias pláticas y cosas que aprender,\npor eso alejamos cualquier sutil tristeza\ndejando que el tiempo nos enseñe a crecer.\n\nNo competimos contra el reloj de nadie\nni seguimos las reglas de la sociedad,\npreferimos que el viento del norte nos radie\nmientras construimos nuestra realidad.\n\nUn paso a la vez, con la mano enlazada,\nasí es como nos gusta a nosotros avanzar,\nsabiendo que la ruta ya está asegurada\nsi nos prometemos nunca dejar de amar."
  },
  {
    title: "22. Constante en el cambio",
    content: "El mundo se mueve, las modas se van,\nlas estaciones giran sin detener su marcha,\npero mis ganas de cuidarte se quedarán\nprotegiendo tu fuego de cualquier escarcha.\n\nTodo cambia rápido a nuestro alrededor,\nla tecnología y la forma de vivir,\npero se mantiene intacto nuestro amor\ncomo el centro firme que nos hace existir.\n\nEres la constante en mi ecuación de vida,\nla variable fija que le da el sentido,\nla respuesta exacta que no da por perdida\nninguna batalla que hayamos vivido.\n\nPasan los años y se transforma el paisaje\npero en tus ojos encuentro el mismo hogar,\nel puerto seguro al final del viaje\ndonde siempre, siempre, voy a retornar."
  },
  {
    title: "23. El arte de escucharte hablar",
    content: "Me gusta escucharte hablar de lo que te apasiona,\nver cómo brillan tus ojos al contar una idea,\nesa chispa tuya es la que me impresiona\ny hace que el mundo se detenga donde sea.\n\nPodrías hablarme de temas complejos o arte,\nde tus proyectos o de lo que hiciste hoy,\nque yo nunca me cansaré de escucharte\nporque muy feliz a tu lado siempre estoy.\n\nTu voz tiene un ritmo que me da tranquilidad,\nun tono suave que me invita a descansar,\nllenando el espacio de total claridad\nmientras me enseñas cómo se debe soñar.\n\nEs un privilegio tener tu inteligencia cerca,\ncompartir la mente con alguien tan especial,\nhaciendo que mi alma se vuelva más terca\nen querer entregarte un amor intelectual."
  },
  {
    title: "24. El eco de tu nombre",
    content: "Mi corazón repite el eco de tu nombre\nen cada espacio libre que tiene la mente,\nno hay un solo día en que no me asombre\nde quererte tanto y de forma tan ferviente.\n\nTe metiste de pronto en mis pensamientos\nconvirtiéndote en mi mejor distracción,\nhilando uno a uno todos mis momentos\ncon las dulces notas de tu propia canción.\n\nEstás presente cuando programo o cuando lee,\nen los pequeños descansos de mi actividad,\nen cada deseo que al universo le planteo\nbuscando siempre tu bienestar y tu paz.\n\nEs un eco hermoso que no genera ruido,\nsino una música que me da dirección,\nsabiendo que el tiempo no será perdido\nsi lo dedicamos a nuestra hermosa unión."
  },
  {
    title: "25. Escondite perfecto",
    content: "Hicimos de nosotros el mejor escondite\ndonde el caos de la vida no puede ingresar,\nun pacto sagrado que el alma repite:\npase lo que pase, te voy a cuidar.\n\nCerramos la puerta a los malos comentarios,\na las envidias y a la negatividad,\ncreando nuestros propios horarios\npara vivir el amor con total libertad.\n\nAquí adentro no importan las presiones externas\nni lo que digan los demás sobre el futuro,\ntenemos nuestras propias luces linternas\npara alumbrar el camino que se ponga oscuro.\n\nEste es nuestro espacio, nuestro pequeño nido,\nel fuerte de roca que nadie puede tirar,\ndonde cada segundo que paso contigo\nme convence de que este es mi verdadero lugar."
  },
  {
    title: "26. La paradoja del tiempo",
    content: "Un minuto contigo vuela como el viento\npero se queda grabado para la eternidad,\nes la paradoja de este sentimiento\ndonde la belleza supera a la realidad.\n\nCuando estamos lejos las horas se hacen largas\ncomo si el reloj se negara a avanzar,\npero cuando vienes me quitas las cargas\ny el tiempo de pronto se pone a volar.\n\nNo sé cómo manejas esa extraña física\nque altera los días según tu posición,\nconvirtiendo el silencio en hermosa música\ny acelerando el ritmo de mi corazón.\n\nPero no me quejo de esa hermosa locura,\nprefiero mil veces que el tiempo vuele así,\nsi cada segundo me da la cordura\nde saber que soy pleno cuando estás junto a mí."
  },
  {
    title: "27. El mejor regalo",
    content: "Si me piden que defina la felicidad\nen una sola frase, en un solo concepto,\ndiría tu nombre con total claridad\nporque estar a tu lado es el plan más perfecto.\n\nNo necesito regalos de gran valor monetario\nni viajes costosos al otro lado del mar,\nme basta con ver en el calendario\nque hoy es otro día que te puedo abrazar.\n\nEres el premio que no estaba buscando\npero que la vida me quiso otorgar,\nel tierno refugio donde voy encontrando\ntodas las razones para continuar.\n\nGracias por ser la pieza que encaja directo\nen los rompecabezas de mi realidad,\nhaciendo que nuestro amor imperfecto\nsea la muestra más pura de la eternidad."
  },
  {
    title: "28. Complicidad de dos",
    content: "Nos entendemos con solo mirarnos de lado\nsin que una palabra tenga que salir,\nes un nivel de confianza tan avanzado\nque me da la certeza de querer compartir.\n\nCompartimos los gustos, las metas, los días,\napoyando al otro en su meta personal,\ncelebrando juntos las pequeñas alegrías\ncon un entusiasmo que se vuelve real.\n\nNo hay secretos oscuros entre nosotros\nporque la verdad es nuestra bandera principal,\nno nos interesa el camino de otros\npues el nuestro se siente genial.\n\nEsta complicidad es nuestro gran tesoro,\nlo que nos mantiene firmes ante la adversidad,\nel lazo de acero, más valioso que el oro,\nque asegura por siempre nuestra hermosa unión."
  },
  {
    title: "29. El arte de cuidar",
    content: "Amarte no es solo decir palabras bonitas\no escribir poemas cuando llega la inspiración,\nes estar presente cuando me necesitas\nponiendo en los hechos todo el corazón.\n\nEs cuidarte cuando te sientes cansada,\nescuchar tus quejas después de un mal día,\ndejar que descanses con la mente relajada\nmientras yo ahuyento cualquier cobardía.\n\nEs un compromiso que nace de adentro,\nde las ganas reales de verte muy bien,\nhaciendo que nuestro pequeño encuentro\nsea el sitio seguro de nuestro propio edén.\n\nTe cuido la espalda, te cuido el camino,\napoyo tus pasos hacia donde quieras ir,\nconvirtiendo este lazo en nuestro destino\ny en la mejor forma que tengo de vivir."
  },
  {
    title: "30. Infinito resumido",
    content: "Aquí se terminan estos versos que te escribo\npero no el sentimiento que los vio nacer,\nmientras tenga vida y me encuentre vivo\nmis ganas de amarte no van a perder.\n\nEres el resumen de lo que es hermoso,\nla combinación exacta de fuerza y bondad,\nel viaje más largo y el más provechoso\nque he emprendido con total voluntad.\n\nNos quedan mil hojas por ir rellenando\nen este gran libro de nuestra relación,\npero sé que lo seguiremos logrando\ncon la misma ternura y la misma pasión.\n\nTe dejo mi amor en estas cuatro estrofas,\ncomo un testimonio de mi realidad,\nlejos de las dudas y de las filosofías mofas,\nprometiendo quererte por la eternidad."
  }
];

const staticStories = [
  {
    title: "1. El gran festín nocturno de Pompompurin",
    content: "Había una vez, en un rincón donde las colinas siempre olían a mantequilla y los árboles daban hojas de galleta, un perrito dorado y muy suave llamado Pompompurin. Llevaba puesto su inseparable boina de color marrón, que combinaba a la perfección con el tono de su pelaje esponjoso. Aquella noche, Purin sentía que el estómago le rugía suavemente, no de hambre, sino de entusiasmo, porque había decidido organizar el pícnic nocturno más grande del año bajo las estrellas.\n\nCon paso lento y tranquilo, Purin comenzó a reunir los ingredientes en su cocina iluminada por una lámpara de tono cálido. Sacó un tazón enorme de cerámica y empezó a batir una crema de vainilla tan suave que parecía una nube. Preparó panecillos recién horneados que desprendían un aroma a canela capaz de relajar a cualquiera que lo respirara, y cortó rodajas de manzanas dulces que brillaban como pequeñas lunas. Sus amigos, el tierno hámster Muffin y el ratoncito Scone, llegaron arrastrando una manta de cuadros amarillos tan grande que cubrió toda la colina suave.\n\nCuando el cielo se tiñó de un azul marino profundo y las primeras estrellas comenzaron a parpadear como chispas de azúcar, todos se sentaron en círculo. Purin sirvió tazas de leche tibia con miel y repartió los postres. El silencio de la noche era interrumpido únicamente por el crujido de las hojas secas y el sonido reconfortante de sus amigos disfrutando de la comida. Muffin se estiró sobre la manta, con los ojos ya entrecerrados por el cansancio, mientras Scone usaba una migaja de pan como almohada.\n\nPurin miró al cielo, suspiró con profunda satisfacción y sintió cómo sus propios ojos se volvían pesados. La colina entera parecía respirar a un ritmo lento y compasivo. Uno a uno, los pequeños animales se acurrucaron cerca del gran perrito dorado, cuyo pelaje era tan cálido como una manta recién sacada de la secadora. Abrazando su suave almohada, Pompompurin cerró los ojos, escuchando el eco del viento entre los árboles, quedándose profundamente dormido bajo el manto estrellado."
  },
  {
    title: "2. El jardín de los conejos lunares",
    content: "En el valle del Trébol de Plata, donde la hierba siempre estaba húmeda por el rocío, vivía una familia de conejos de pelaje tan blanco que parecían copos de nieve flotando en la oscuridad. El más pequeño de ellos, un conejito de orejas caídas llamado copito, tenía la tarea más importante de la noche: vigilar el crecimiento de las flores de luna, unas plantas mágicas que solo abrían sus pétalos cuando la noche era completamente clara.\n\nCopito caminaba despacio, sintiendo la frescura de la tierra bajo sus patas. El jardín era un lugar completamente silencioso, interrumpido solo por el sutil clic de los pétalos de las flores al abrirse, liberando un aroma dulce y relajante que olía a lavanda y manzanilla. A lo lejos, la luna llena brillaba con una luz plateada tan intensa que hacía que el jardín pareciera sacado de un sueño. Copito se sentó junto a un gran arbusto de bayas nocturnas y observó cómo las luciérnagas dibujaban estelas doradas en el aire, moviéndose con una lentitud casi hipnótica.\n\nOtros conejos del valle comenzaron a llegar al jardín, moviéndose con pasos suaves para no romper la calma del lugar. No hablaban; solo se sentaban juntos en la hierba, moviendo sus narices al ritmo constante de la brisa. Una gran constelación con forma de conejo corría lentamente por el firmamento, recordando a los pequeños habitantes que el cielo siempre cuidaba de su hogar. Las flores de luna comenzaron a emitir un zumbido sumamente suave, una melodía casi imperceptible que actuaba como una canción de cuna para todo el valle.\n\nEl sueño empezó a envolver a Copito como una manta pesada y tibia. Sus orejas se relajaron por completo y su respiración se sincronizó con el susurro del viento entre los tréboles. Se recostó de lado, apoyando la cabeza sobre el lomo de su madre, sintiendo su calor constante. El jardín entero se sumergió en una quietud absoluta, y los conejos, rodeados de flores brillantes y estrellas titilantes, se entregaron a un descanso profundo y reparador."
  },
  {
    title: "3. El gato que tejía constelaciones",
    content: "Milo era un gato de pelaje gris oscuro y ojos verdes como el musgo del bosque, que vivía en el tejado de la casa más alta de un pequeño pueblo costero. Mientras todos los humanos dormían, Milo tenía un trabajo secreto que realizaba con absoluta paciencia: con sus patas delanteras, atrapaba los hilos invisibles de luz que caían de la luna y los tejía para unir las estrellas, asegurándose de que las constelaciones no se desarmaran durante la noche.\n\nAquella noche, el cielo estaba especialmente despejado y el mar abajo repetía el balanceo de las olas con un sonido rítmico: shhh, shhh. Milo se estiró perezosamente, arqueando la espalda, y caminó por las tejas templadas que aún conservaban el calor del sol de la tarde. Se sentó en la punta de la chimenea y extendió una pata hacia el firmamento. Con un movimiento suave, atrapó un hilo de plata y lo enredó alrededor de la Estrella Polar, asegurando el gran mapa del cielo para los navegantes que dormían en sus barcos.\n\nMientras tejía, un pequeño ratón de campo se asomó por una grieta del tejado. En lugar de correr, el ratón se sentó a observar el trabajo del felino, sabiendo que en las horas nocturnas existía una tregua de paz. Milo le dedicó un suave parpadeo, una señal felina de absoluta confianza. El aire olía a sal, a madera vieja y a la frescura de la noche alta. El ronroneo de Milo comenzó a sonar, un motorcito constante y grave que vibraba a través de las tejas, esparciendo una sensación de tranquilidad por todo el vecindario.\n\nPoco a poco, las constelaciones quedaron firmes y el cielo adquirió un tono azul aún más profundo, casi negro. Milo sintió que su tarea estaba cumplida por esa noche. Se enroscó sobre sí mismo en un rincón protegido del viento, escondiendo la nariz debajo de su cola esponjosa. El ratón también se acurrucó en su pequeño nido de paja. Con el ronroneo constante del gato flotando en el aire del invierno, el tejado se convirtió en el lugar más pacífico de la Tierra, y ambos animales se durmieron bajo el cielo perfecto que Milo había terminado de tejer."
  },
  {
    title: "4. El banquete de las hadas del bosque",
    content: "En el corazón del Bosque Susurrante, las mesas no eran de madera, sino de grandes champiñones de color marrón suave, y las luces eran pequeñas orquídeas que guardaban luz solar en su interior. Las hadas de la cocina nocturna estaban terminando de preparar el banquete de medianoche, un evento que se realizaba para celebrar el cambio de estación. El menú consistía en alimentos diseñados no solo para saciar, sino para traer los sueños más pacíficos.\n\nHabía grandes fuentes llenas de sopa de calabaza dorada que humeaba lentamente, desprendiendo notas de nuez moscada. En el centro, se apilaban panes de miel redondos, cuyas costras crujían sutilmente al enfriarse. Las hadas del aire servían néctar de moras silvestres en copas talladas en bellotas caídas. Todo se hizo con una lentitud ceremonial; nadie corría, nadie alzaba la voz. El sonido de los cubiertos de madera contra los platos de hojas verdes era como el repiqueteo de una lluvia fina de primavera.\n\nLos animales del bosque —desde los pesados tejones hasta los diminutos ciervos de ojos oscuros— se acercaron al claro para compartir el alimento. Al dar el primer bocado a la sopa tibia, una calidez reconfortante comenzó a extenderse por las extremidades de los comensales, aliviando el cansancio de un largo día de caminata. El pan de miel parecía relajar los hombros de los osos, quienes se sentaban pesadamente sobre el musgo blando, dejando escapar profundos suspiros de comodidad.\n\nCuando el banquete terminó, las hadas apagaron suavemente las orquídeas luminosas, dejando solo la luz plateada de las estrellas para guiar la vista. La comida había cumplido su propósito mágico: el claro del bosque se llenó de una pesadez agradable. Los animales se echaron unos junto a otros, compartiendo el calor de sus pelajes. Las hadas se colgaron de las ramas más bajas, envolviéndose en sus propias alas transparentes. El bosque quedó en un estado de quietud absoluta, donde solo existía el ritmo pausado de la respiración de la naturaleza."
  },
  {
    title: "5. El viaje de la princesa del amanecer",
    content: "La princesa Aurelia vivía en un palacio flotante hecho de nubes blancas y suaves que cambiaban de forma con el viento. Su deber principal era recorrer los reinos inferiores justo antes de que saliera el sol, esparciendo un polvo de estrellas dorado que aseguraba que los últimos sueños de los humanos fueran los más tranquilos y reparadores de todos. Vestida con un camisón de seda que no hacía ruido al moverse, Aurelia caminaba por los pasillos de su palacio suspendido.\n\nPara su viaje nocturno, la princesa montaba un gran cisne blanco de plumas densas llamado Nieve. Aurelia se sentaba en su lomo y el ave abría sus alas monumentales, descendiendo a través de las corrientes de aire templado con una suavidad asombrosa. Pasaban por encima de las altas montañas coronadas de nieve, sobre los ríos que parecían cintas de plata oscura y sobre las ciudades donde las chimeneas aún soltaban los últimos hilos de humo del día.\n\nDesde su bolsa de terciopelo, Aurelia tomaba puñados de un polvo brillante que olía levemente a azahar. Con movimientos pausados y elegantes, lo dejaba caer sobre los techos de las casas. El polvo descendía flotando como nieve fina, entrando por las ventanas abiertas y rozando las frentes de los niños, los ancianos y las mascotas. Al contacto con la magia de la princesa, cualquier pesadilla se disolvía al instante, transformándose en imágenes de campos verdes, mares calmos y cielos despejados.\n\nEl viaje llegaba a su fin cuando el horizonte empezaba a teñirse de un violeta muy suave. Nieve regresaba al palacio de nubes, batiendo las alas con un ritmo decreciente. Aurelia, sintiendo el esfuerzo del viaje y la pesadez de la noche en sus propios ojos, se recostó en su cama hecha de la nube más densa y mullida del reino. Se tapó con una colcha tejida con hilos de luna y dejó caer la cabeza en la almohada. Sabiendo que todo el mundo abajo descansaba en paz gracias a su labor, la princesa cerró los ojos y se sumergió en su propio sueño dorado."
  },
  {
    title: "6. La pastelería del oso somnoliento",
    content: "Barnaby era un gran oso pardo que regentaba la única pastelería del Bosque de la Niebla. A diferencia de otras tiendas, la de Barnaby abría sus puertas cuando el sol se ocultaba, porque sus clientes eran los animales nocturnos que necesitaban energía tranquila para sus jornadas o una cena suave antes de ir a hibernar. La pastelería era un lugar cálido, con una gran chimenea de piedra donde los troncos de roble ardían con un chisporroteo constante y predecible.\n\nBarnaby se movía por la cocina con pasos pesados pero cuidadosos, usando un delantal blanco que contrastaba con su espeso pelaje marrón. Aquella noche preparaba tartas de crema de avellanas y galletas de avena con trozos de chocolate blanco. El vapor que salía del horno empañaba los vidrios de la tienda, creando un ambiente de total aislamiento del frío exterior. Un par de búhos jóvenes se sentaron en la barra de madera, ululando muy bajito mientras esperaban sus tazas de chocolate espeso con malvaviscos flotantes.\n\nEl oso servía a cada comensal con una sonrisa tranquila, moviendo sus grandes manos con una delicadeza sorprendente. En las mesas del rincón, una familia de erizos compartía un bizcocho de manzana caliente, masticando despacio mientras el calor del lugar les quitaba el frío de las púas. No había prisa en la pastelería de Barnaby; el tiempo parecía detenerse entre el olor a azúcar tostada y el calor reconfortante de la leña.\n\nCuando la madrugada avanzó y los clientes terminaron sus postres, la pastelería fue quedando vacía. Barnaby limpió las mesas con un paño húmedo, apagó las luces principales y dejó que la chimenea se consumiera hasta convertirse en brasas rojas que emitían una luz tenue. El gran oso se sentó en su sillón de mimbre junto al fuego, estiró sus enormes patas y dejó caer la cabeza hacia atrás. Escuchando el viento invernal chocar suavemente contra las ventanas tejidas de vaho, Barnaby se quedó profundamente dormido, con el aroma de los pasteles flotando en sus sueños."
  },
  {
    title: "7. El secreto de las estrellas apagadas",
    content: "En el observatorio más alto del Reino del Cielo, vivía una pequeña criatura llamada Astro, cuyo cuerpo estaba hecho de pura luz azulina. Astro era el encargado de cuidar a las estrellas jóvenes, aquellas que aún no sabían cómo titilar al ritmo correcto y que a veces se cansaban de brillar tanto durante las largas noches de invierno. Su trabajo consistía en darles un baño de polvo de cuarzo y arrullarlas para que descansaran antes de su próximo turno en el firmamento.\n\nAstro caminaba por los senderos de nubes, llevando un pequeño balde de plata lleno de agua de cometa líquida. Se acercó a una estrella pequeña que parpadeaba con debilidad, mostrando signos de fatiga. Con una esponja de algodón de azúcar, Astro limpió la superficie de la estrella, quitándole el polvo cósmico oscuro que se le había afectando. Al notar el contacto suave, la estrellita comenzó a emitir un brillo más cálido y constante, como el de una vela protegida de la brisa.\n\nUna vez limpias, Astro colocaba a las estrellas en grandes cunas hechas de nubes de tormenta gris, que eran las más mullidas y pesadas. Les cantaba una melodía antigua, una canción sin palabras que imitaba el sonido del vacío del espacio: un susurro constante, profundo y pacífico. A medida que avanzaba la melodía, las estrellas iban disminuyendo su intensidad, apagándose lentamente hasta quedar convertidas en pequeñas esferas de piedra tibia que descansaban en la oscuridad protectora.\n\nCuando la última estrella de su sector se durmió, Astro miró hacia la Tierra, viendo las luces distantes de las casas de los humanos. Sintió una profunda conexión con el silencio que unía al cielo con el suelo. Se acostó en el centro del observatorio, dejando que su propia luz azul disminuyera su brillo hasta volverse un tenue resplandor de noche. Con el universo entero funcionando en perfecta armonía silenciosa, Astro cerró los ojos y se sumergió en el descanso eterno del cosmos."
  },
  {
    title: "8. El viaje del gato de Cheshire por el bosque de hilos",
    content: "En una dimensión donde el cielo no era de aire sino de terciopelo morado, el gato de Cheshire caminaba con su clásica sonrisa, aunque esta vez no buscaba hacer travesuras, sino encontrar el rincón más cómodo para su siesta diaria. Sus pasos eran completamente inaudibles porque el suelo del bosque estaba hecho de millones de hilos de lana de colores pastel que se hundían suavemente bajo el peso de sus patas.\n\nA medida que avanzaba, el gato veía cómo las ramas de los árboles, también de lana trenzada, se mecían con una lentitud de péndulo. De los árboles colgaban pequeñas esferas de cristal que guardaban en su interior estrellas parpadeantes. El reflejo de esas luces sobre su pelaje rayado creaba un efecto óptico tranquilizador, como si estuviera caminando a través de un caleidoscopio en cámara lenta. El gato dejó escapar un bostezo largo, mostrando sus dientes blancos, y decidió que era hora de detenerse.\n\nEncontró un gran ovillo de lana rosa que era tan grande como una casa pequeña. Se subió a la cima con movimientos ágiles y pausados, encontrando un hueco perfecto en el centro que parecía diseñado a la medida de su cuerpo. Al enroscarse, el ovillo cedió un poco, abrazándolo por todos lados y manteniéndolo a salvo de cualquier corriente de aire. El gato comenzó a emitir su característico ronroneo, que hacía que los hilos de lana a su alrededor vibraran con una frecuencia sumamente relajante.\n\nEl bosque entero parecía responder a su descanso. Las esferas de cristal disminuyeron su brillo y los hilos del suelo se acomodaron en un orden perfecto. La silueta del gato de Cheshire empezó a desvanecerse lentamente, dejando al final solo su sonrisa flotando sobre el ovillo rosa, una sonrisa que también se fue entornando hasta convertirse en una línea delgada de absoluta paz. Finalmente, el gato desapareció por completo en el mundo de los sueños, dejando al bosque de hilos en una calma total."
  },
  {
    title: "9. El lago de los cisnes de cristal",
    content: "Más allá de las colinas de la Gran Corona, existía un lago cuyas aguas eran tan calmadas y transparentes que parecían de cristal macizo. En este lugar habitaban los cisnes de cristal, aves de un material traslúcido que reflejaba los colores del cielo nocturno con una pureza sobrehumana. La reina de los cisnes, Seraphina, guiaba a su bandada todas las noches en una coreografía silenciosa diseñada para mantener el agua del lago limpia y pura.\n\nSeraphina avanzaba por la superficie del agua sin crear una sola onda. Su cuerpo reflejaba el paso de la Vía Láctea, llenándose de tonos azules, violetas y destellos plateados. Los dos cisnes la seguían en una línea perfecta, moviendo sus largos cuellos con una simetría perfecta. El silencio alrededor era tal que se podía escuchar el sutil roce de las plumas de cristal contra el aire de la noche, un sonido similar al de campanillas de viento lejanas.\n\nEn la orilla del lago, los sauces llorones dejaban caer sus ramas largas hasta tocar el agua. Las hojas de los sauces absorbían la luz sobrante de los cisnes, brillando con un verde esmeralda muy suave. Un viejo búho, posado en la rama más alta, vigilaba el ritual con los ojos entornados, disfrutando de la paz que emanaba de la laguna. No había depredadores ni peligros en este santuario; el respeto por la quietud era la ley suprema del lugar.\n\nCuando la coreografía terminó, los cisnes se agruparon en el centro del lago. Escondieron sus cabezas debajo de sus alas brillantes, convirtiéndose en hermosas esculturas luminosas que flotaban en la oscuridad. El agua del lago reflejó por última vez la inmensidad del cielo estrellado antes de sumergirse en una quietud absoluta. Seraphina cerró sus ojos transparentes, sintiendo el balanceo casi imperceptible del agua, y todo el reino del cristal se durmió bajo la custodia de la noche."
  },
  {
    title: "10. La princesa y el unicornio de la Luna",
    content: "En el Reino de la Alta Noche, la princesa Elena tenía una hermosa amistad con un unicornio cuyo pelaje era del color de la luna creciente y cuya crin estaba tejida con hilos de estrellas reales. El unicornio, llamado Celio, bajaba de las montañas sagradas cada vez que la medianoche se instalaba en el reino, con el único propósito de acompañar a la princesa en sus últimas caminatas antes de descansar.\n\nElena salía al jardín del palacio, donde el suelo estaba cubierto de pétalos de rosas blancas que amortiguaban el sonido de sus pasos. Celio la esperaba junto a la gran fuente de agua clara, moviendo su cabeza con suavidad en señal de saludo. La princesa se acercaba y acariciaba el lomo del animal, sintiendo una calidez inmediata que le quitaba cualquier rastro de cansancio o preocupación que hubiera acumulado durante sus deberes reales.\n\nJuntos caminaban por los senderos arbolados, observando cómo las hojas de los árboles captaban la luz plateada que emanaba del cuerno de Celio. El unicornio caminaba con una lentitud majestuosa, dictando el ritmo de la caminata. El aire de la noche era fresco y traía consigo el aroma de los pinos lejanos y de la tierra húmeda. A lo lejos, el canto de un grillo solitario servía como metrónomo para la tranquilidad del paisaje.\n\nTras completar el recorrido, regresaban a las puertas de los aposentos de la princesa. Celio apoyaba su frente suave contra la mano de Elena, transmitiéndole un último destello de magia protectora para sus sueños. La princesa entraba a su habitación, se acostaba en su cama con dosel y se cubría con las mantas pesadas de terciopelo. Desde su ventana, veía al unicornio alejarse lentamente hacia las montañas, brillando como una pequeña estrella en movimiento. Con el corazón lleno de seguridad y paz, Elena cerraba los ojos, quedándose profundamente dormida."
  }
];

export default function PoetrySection() {
  const supabase = createClient();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<"acrostic" | "poem" | "story" | "write">("acrostic");
  const [selectedItem, setSelectedItem] = useState<{ title: string; content: string } | null>(null);

  // Dynamic user written content loaded from database/localstorage
  const [customItems, setCustomItems] = useState<WrittenItem[]>([]);

  // Form states
  const [writeType, setWriteType] = useState<"poem" | "story">("poem");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  // Load custom items
  useEffect(() => {
    async function loadData() {
      try {
        const { data: poemsData, error: poemsErr } = await supabase
          .from("poems")
          .select("*");
          
        const { data: storiesData, error: storiesErr } = await supabase
          .from("stories")
          .select("*");

        let loaded: WrittenItem[] = [];
        
        if (!poemsErr && poemsData) {
          loaded = [...loaded, ...poemsData.map((p: any) => ({ ...p, type: p.type as "acrostic" | "poem" }))];
        }
        if (!storiesErr && storiesData) {
          loaded = [...loaded, ...storiesData.map((s: any) => ({ ...s, type: "story" as const }))];
        }

        if (loaded.length > 0) {
          setCustomItems(loaded);
        } else {
          loadLocal();
        }
      } catch (err) {
        loadLocal();
      }
    }

    function loadLocal() {
      const local = localStorage.getItem("eoa_custom_writings");
      if (local) {
        try {
          setCustomItems(JSON.parse(local));
        } catch {}
      }
    }

    loadData();
  }, []);
  const handleSaveWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newItem: WrittenItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      content: newContent,
      type: writeType
    };

    // Update state
    const updated = [...customItems, newItem];
    setCustomItems(updated);
    localStorage.setItem("eoa_custom_writings", JSON.stringify(updated));

    // Reset Form
    setNewTitle("");
    setNewContent("");
    setActiveTab(writeType === "poem" ? "poem" : "story");
    setSelectedItem(newItem);

    // Save to Supabase
    try {
      if (writeType === "poem") {
        await supabase.from("poems").insert({
          title: newItem.title,
          content: newItem.content,
          type: "poem"
        });
      } else {
        await supabase.from("stories").insert({
          title: newItem.title,
          content: newItem.content
        });
      }
    } catch (err) {
      console.warn("Could not save writing to Supabase, falling back to local storage.", err);
    }
  };

  // Compile lists merging static & custom data
  const acrosticsList = staticAcrostics;
  const poemsList = [...staticPoems, ...customItems.filter(i => i.type === "poem")];
  const storiesList = [...staticStories, ...customItems.filter(i => i.type === "story")];

  const renderList = () => {
    switch (activeTab) {
      case "acrostic":
        return acrosticsList;
      case "poem":
        return poemsList;
      case "story":
        return storiesList;
      default:
        return [];
    }
  };

  const currentList = renderList();

  return (
    <div style={{ display: "flex", gap: "24px", minHeight: "80vh", flexWrap: "wrap" }}>
      
      {/* Left panel: Catalog Selector */}
      <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Navigation buttons */}
        <div className="glass" style={{ display: "flex", flexDirection: "column", padding: "8px", gap: "6px" }}>
          <button
            onClick={() => { setActiveTab("acrostic"); setSelectedItem(null); }}
            className="btn-glass"
            style={{
              justifyContent: "flex-start",
              background: activeTab === "acrostic" ? "var(--accent)" : "transparent",
              borderColor: activeTab === "acrostic" ? "var(--accent)" : "transparent",
              color: activeTab === "acrostic" ? "#ffffff" : "inherit"
            }}
          >
            🌸 Acrósticos para Dalai
          </button>
          <button
            onClick={() => { setActiveTab("poem"); setSelectedItem(null); }}
            className="btn-glass"
            style={{
              justifyContent: "flex-start",
              background: activeTab === "poem" ? "var(--accent)" : "transparent",
              borderColor: activeTab === "poem" ? "var(--accent)" : "transparent",
              color: activeTab === "poem" ? "#ffffff" : "inherit"
            }}
          >
            💖 Poemas de Amor Puro
          </button>
          <button
            onClick={() => { setActiveTab("story"); setSelectedItem(null); }}
            className="btn-glass"
            style={{
              justifyContent: "flex-start",
              background: activeTab === "story" ? "var(--accent)" : "transparent",
              borderColor: activeTab === "story" ? "var(--accent)" : "transparent",
              color: activeTab === "story" ? "#ffffff" : "inherit"
            }}
          >
            🌙 Cuentos para Dormir
          </button>
          
          <div style={{ height: "1px", background: "var(--border-color)", margin: "4px 0" }}></div>

          <button
            onClick={() => { setActiveTab("write"); setSelectedItem(null); }}
            className="btn-glass btn-primary"
            style={{ justifyContent: "center" }}
          >
            ✍️ Escribir Poema o Cuento
          </button>
        </div>

        {/* Title List */}
        {activeTab !== "write" && (
          <div className="glass" style={{ padding: "16px", maxHeight: "50vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", paddingLeft: "8px", marginBottom: "8px" }}>Índice de Títulos</span>
            {currentList.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedItem(item)}
                className="btn-glass"
                style={{
                  justifyContent: "flex-start",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  padding: "10px 12px",
                  background: selectedItem?.title === item.title ? "rgba(255,255,255,0.06)" : "transparent",
                  color: selectedItem?.title === item.title ? "var(--accent-light)" : "var(--text-secondary)"
                }}
              >
                {item.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right panel: Book/Reader Area */}
      <div 
        className="glass" 
        style={{ 
          flex: "2 1 500px", 
          padding: "40px", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: activeTab === "write" || selectedItem ? "flex-start" : "center",
          alignItems: activeTab === "write" || selectedItem ? "stretch" : "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
        }}
      >
        {activeTab === "write" ? (
          /* WRITE FORM */
          <div className="animate-fade">
            <h3 style={{ fontSize: "1.5rem", marginBottom: "4px" }}>Nueva Inspiración</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "24px" }}>Agrega un poema o cuento a la colección para Dalai.</p>

            <form onSubmit={handleSaveWriting} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="writeType"
                    checked={writeType === "poem"}
                    onChange={() => setWriteType("poem")}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  Poema
                </label>
                <label style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="writeType"
                    checked={writeType === "story"}
                    onChange={() => setWriteType("story")}
                    style={{ accentColor: "var(--accent)" }}
                  />
                  Cuento de amor
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Título</label>
                <input
                  type="text"
                  placeholder="Ej. La melodía de tu risa..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-glass"
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Texto</label>
                <textarea
                  placeholder="Escribe tus versos o párrafos aquí..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="input-glass"
                  style={{ minHeight: "220px", resize: "vertical", fontFamily: "inherit" }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn-glass btn-primary">
                  Guardar en la Antología
                </button>
              </div>
            </form>
          </div>
        ) : selectedItem ? (
          /* READ VIEW */
          <div className="animate-fade" style={{ maxWidth: "650px", margin: "0 auto", width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "2rem", fontFamily: "Georgia, serif", color: "var(--text-primary)" }}>{selectedItem.title}</h2>
              <div style={{ width: "80px", height: "1px", background: "var(--accent)", margin: "16px auto 0" }}></div>
            </div>
            
            {/* Poetry/Story text container */}
            <div
              style={{
                fontFamily: "Georgia, serif", // Classic book font
                fontSize: "1.15rem",
                lineHeight: "1.9",
                color: "#e2e8f0",
                whiteSpace: "pre-wrap",
                textAlign: activeTab === "story" ? "justify" : "center",
                padding: "0 16px"
              }}
            >
              {selectedItem.content}
            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <span style={{ fontSize: "3rem" }}>📖</span>
            <h3 style={{ marginTop: "16px", fontSize: "1.3rem" }}>Rincón de Lectura</h3>
            <p style={{ marginTop: "8px", fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: "320px" }}>
              Selecciona cualquier título del catálogo de la izquierda para comenzar a leer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
