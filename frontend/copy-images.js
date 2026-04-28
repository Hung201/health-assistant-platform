const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\npt65\\.gemini\\antigravity\\brain\\5ca7a063-e3ce-4e50-b478-468c04dede90';
const dstDir = path.join(__dirname, 'public', 'images', 'specialties');
const dstImgDir = path.join(__dirname, 'public', 'images');

// Ensure dirs exist
fs.mkdirSync(dstDir, { recursive: true });

const copies = [
  // Specialty icons
  ['specialty_internal_medicine_1776999979884.png', path.join(dstDir, 'internal-medicine.png')],
  ['specialty_cardiology_1776999990965.png', path.join(dstDir, 'cardiology.png')],
  ['specialty_orthopedics_1777000004616.png', path.join(dstDir, 'orthopedics.png')],
  ['specialty_dermatology_1777000027074.png', path.join(dstDir, 'dermatology.png')],
  ['specialty_neurology_1777000041297.png', path.join(dstDir, 'neurology.png')],
  ['specialty_ophthalmology_1777000054621.png', path.join(dstDir, 'ophthalmology.png')],
  ['specialty_pediatrics_1777000077577.png', path.join(dstDir, 'pediatrics.png')],
  ['specialty_obstetrics_1777000090798.png', path.join(dstDir, 'obstetrics.png')],
  ['specialty_default_1777000104611.png', path.join(dstDir, 'default.png')],
  // Section images
  ['hero_doctor_patient_1777000133272.png', path.join(dstImgDir, 'hero-doctor.png')],
  ['feature_ai_diagnosis_1777000147209.png', path.join(dstImgDir, 'feature-ai.png')],
  ['blog_healthcare_community_1777000160410.png', path.join(dstImgDir, 'blog-community.png')],
  // New section images
  ['section_ask_doctor_1777001286255.png', path.join(dstImgDir, 'ask-doctor.png')],
  ['section_health_handbook_1777001299341.png', path.join(dstImgDir, 'health-handbook.png')],
];

copies.forEach(([src, dst]) => {
  const srcPath = path.join(srcDir, src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, dst);
    console.log(`OK: ${src} -> ${path.basename(dst)}`);
  } else {
    console.log(`MISSING: ${src}`);
  }
});

console.log('\nDone! All images copied.');
