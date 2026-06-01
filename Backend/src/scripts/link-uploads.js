const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '../data/sample_products_mongo.json');
const uploadsDir = path.resolve(__dirname, '../../uploads');

function normalize() {
  if (!fs.existsSync(dataPath)) {
    console.error('Data file not found:', dataPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, 'utf8');
  const products = JSON.parse(raw);

  for (const p of products) {
    // thumbnail
    if (p.thumbnail) {
      const thumbName = path.basename(p.thumbnail);
      p.thumbnail = `/uploads/${thumbName}`;
    }

    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        if (Array.isArray(v.images)) {
          v.images = v.images.map(img => {
            const name = path.basename(img);
            return `/uploads/${name}`;
          });
        }
      }
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(products, null, 4), 'utf8');
  console.log('Đã chuẩn hóa đường dẫn ảnh trong', dataPath);
}

normalize();
