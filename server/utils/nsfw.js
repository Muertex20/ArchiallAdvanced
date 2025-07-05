const nsfw = require('nsfwjs');
const tf = require('@tensorflow/tfjs');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

let nsfwModel = null;
(async () => {
  nsfwModel = await nsfw.load();
  console.log('Modelo NSFWJS cargado');
})();

exports.isImageNSFW = async (imagePath) => {
  if (!nsfwModel) throw new Error('El modelo NSFWJS no está cargado');
  const img = await loadImage(imagePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const predictions = await nsfwModel.classify(canvas);
  const nsfwScore = predictions.find(p => p.className === 'Porn' || p.className === 'Hentai' || p.className === 'Sexy');
  return nsfwScore && nsfwScore.probability > 0.7;
};

exports.isVideoNSFW = async (videoPath) => {
  const framesDir = path.join(__dirname, '../temp_frames_' + Date.now());
  fs.mkdirSync(framesDir);
  try {
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', resolve)
        .on('error', reject)
        .screenshots({ count: 2, folder: framesDir, filename: 'frame-%i.png' });
    });
    const frameFiles = fs.readdirSync(framesDir);
    let esPorno = false;
    for (const frame of frameFiles) {
      const framePath = path.join(framesDir, frame);
      if (await exports.isImageNSFW(framePath)) {
        esPorno = true;
        break;
      }
    }
    fs.rmSync(framesDir, { recursive: true, force: true });
    return esPorno;
  } catch (e) {
    try { fs.rmSync(framesDir, { recursive: true, force: true }); } catch (e2) { }
    throw e;
  }
};
