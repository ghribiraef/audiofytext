import 'dotenv/config';
import express from 'express';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialisation d'Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Configuration du client Google Cloud
const client = new TextToSpeechClient();

// Configuration des chemins
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const soundsDir = path.join(__dirname, 'sounds');

// Assurez-vous que le dossier "sounds" existe
import { mkdir } from 'fs/promises';
await mkdir(soundsDir, { recursive: true });

// Route POST pour convertir le texte en audio
app.post('/convert', async (req, res) => {
  try {
    const { engine, data } = req.body;

    // Validation du payload
    if (engine !== 'Google' || !data || !data.text || !data.voice) {
      return res.status(400).json({ success: false, error: 'Payload invalide' });
    }

    const { text, voice, gender, name } = data;

    // Configuration de la requête Google Cloud Text-to-Speech
    const request = {
      input: { text: text },
      voice: { languageCode: voice, ssmlGender: gender, name: name },
      audioConfig: { audioEncoding: 'MP3' },
    };

    // Appel à l'API Google Cloud
    const [response] = await client.synthesizeSpeech(request);

    // Enregistrement du fichier audio
    const fileName = `voice_${Date.now()}.mp3`;
    const filePath = path.join(soundsDir, fileName);
    await fs.writeFile(filePath, response.audioContent, 'binary');

    // Réponse avec le lien du fichier
    return res.json({
      success: true,
      file: `/sounds/${fileName}`,
    });

  } catch (error) {
    console.error('Erreur :', error.message);
    return res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
  }
});

// Middleware pour servir les fichiers statiques du dossier "sounds"
app.use('/sounds', express.static(soundsDir));

// Démarrage du serveur
app.listen(port, () => {
  console.log(`API démarrée sur http://localhost:${port}`);
});
