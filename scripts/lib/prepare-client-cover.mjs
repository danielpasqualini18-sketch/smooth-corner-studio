import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
export async function prepareClientCover(source, directory) {
 const full=await sharp(source).rotate().resize({width:1920,height:2560,fit:'inside',withoutEnlargement:true}).webp({quality:82,effort:5}).toBuffer({resolveWithObject:true});
 await fs.writeFile(path.join(directory,'cover.webp'),full.data);
 let bytes=full.data.length;
 const variants=[];
 for(const width of [800,1440].filter(width=>width<full.info.width)) {
  const file=`cover-${width}w.webp`;
  const buffer=await sharp(full.data).resize({width}).webp({quality:80,effort:5}).toBuffer();
  await fs.writeFile(path.join(directory,file),buffer);bytes+=buffer.length;variants.push({file,width});
 }
 variants.push({file:'cover.webp',width:full.info.width});
 return {file:'cover.webp',width:full.info.width,height:full.info.height,variants,bytes};
}
