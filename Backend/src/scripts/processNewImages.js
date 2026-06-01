const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../..');
const srcDir = path.join(rootDir, 'ảnh');
const destDir = path.resolve(__dirname, '../../uploads');
const jsonPath = path.resolve(__dirname, '../data/sample_products_mongo.json');

// Helper to clean and slugify names
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Normalize accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
}

function getSlugifiedFilename(file) {
  const ext = path.extname(file);
  const nameWithoutExt = path.basename(file, ext);
  
  let cleanName = nameWithoutExt;
  // Specific renames to keep it very clean and standard
  if (cleanName.toLowerCase() === 'xs') cleanName = 'iphone-xs';
  else if (cleanName.toLowerCase() === 'xs 2') cleanName = 'iphone-xs-2';
  else if (cleanName.toLowerCase() === 'xs 3') cleanName = 'iphone-xs-3';
  else if (cleanName.toLowerCase() === 'baner') cleanName = 'banner';
  else if (cleanName === 'iPhone 11PRM') cleanName = 'iphone-11-pro-max';
  else if (cleanName === 'iPhone 11PRM 2') cleanName = 'iphone-11-pro-max-2';
  else if (cleanName === 'iPhone 11PRM 3') cleanName = 'iphone-11-pro-max-3';
  else if (cleanName === 'iPhone 13Mini') cleanName = 'iphone-13-mini';
  else if (cleanName === 'iPhone 13Mini 2') cleanName = 'iphone-13-mini-2';
  else if (cleanName === 'iPhone 13Mini 3') cleanName = 'iphone-13-mini-3';
  else if (cleanName === 'iPhone 13Thường') cleanName = 'iphone-13';
  else if (cleanName === 'iPhone 13Thường 2') cleanName = 'iphone-13-2';
  else if (cleanName === 'iPhone 15 Thường') cleanName = 'iphone-15';
  else if (cleanName === 'iPhone 15 Thường 2') cleanName = 'iphone-15-2';
  else if (cleanName === 'iPhone 15 Thường 3') cleanName = 'iphone-15-3';
  else if (cleanName === 'iPhone 15PRM 256GB') cleanName = 'iphone-15-pro-max-256gb';
  else if (cleanName === 'iPhone 15Pro 256GB') cleanName = 'iphone-15-pro-256gb';
  else if (cleanName === 'iPhone 16PRM 256GB') cleanName = 'iphone-16-pro-max-256gb';
  else if (cleanName === 'iPhone 16Plus 128GB') cleanName = 'iphone-16-plus-128gb';
  else if (cleanName === 'iPhone 16Plus 128GB 2') cleanName = 'iphone-16-plus-128gb-2';
  else if (cleanName === 'iPhone 16Pro 128GB Và 256GB') cleanName = 'iphone-16-pro-128gb-256gb';
  else if (cleanName === 'iPhone 16Pro 128GB Và 256GB 2') cleanName = 'iphone-16-pro-128gb-256gb-2';
  else if (cleanName === 'iPhone 16Thường 128GB') cleanName = 'iphone-16-128gb';
  else if (cleanName === 'iPhone 16Thường 128GB 2') cleanName = 'iphone-16-128gb-2';
  else if (cleanName === 'iPhone 16Thường 128GB 3') cleanName = 'iphone-16-128gb-3';
  else {
    cleanName = slugify(cleanName);
  }

  return cleanName + ext.toLowerCase();
}

async function run() {
  console.log('--- Bắt đầu xử lý hình ảnh và dữ liệu sản phẩm ---');
  
  if (!fs.existsSync(srcDir)) {
    console.error(`Không tìm thấy thư mục nguồn: ${srcDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`Đã tạo thư mục đích: ${destDir}`);
  }

  // 1. Copy và chuẩn hóa tên file hình ảnh
  const files = fs.readdirSync(srcDir);
  const fileMapping = {}; // maps original filename to slugified filename
  
  console.log(`Tìm thấy ${files.length} tệp trong thư mục ảnh.`);
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const stat = fs.statSync(srcPath);
    
    if (stat.isFile()) {
      const destFilename = getSlugifiedFilename(file);
      const destPath = path.join(destDir, destFilename);
      
      fs.copyFileSync(srcPath, destPath);
      fileMapping[file] = destFilename;
      console.log(`Đã sao chép: "${file}" -> "${destFilename}"`);
    }
  }

  // 2. Đọc file JSON sản phẩm cũ
  if (!fs.existsSync(jsonPath)) {
    console.error(`Không tìm thấy file JSON sản phẩm tại: ${jsonPath}`);
    process.exit(1);
  }
  
  let products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Đã đọc ${products.length} sản phẩm từ file JSON.`);

  // Loại bỏ các bản ghi trùng lặp (ví dụ 5 sản phẩm bị nhân đôi trong file gốc)
  const seen = new Set();
  const uniqueProducts = [];
  for (const p of products) {
    if (!seen.has(p.slug)) {
      seen.add(p.slug);
      uniqueProducts.push(p);
    }
  }
  products = uniqueProducts;
  console.log(`Đã lọc trùng lặp, còn lại ${products.length} sản phẩm.`);

  // 3. Cập nhật các sản phẩm hiện có
  for (let p of products) {
    if (p.slug === 'apple-iphone-13-mini') {
      p.thumbnail = `/uploads/${fileMapping['iPhone 13Mini.jpg'] || 'iphone-13-mini.jpg'}`;
      p.variants[0].images = [
        `/uploads/${fileMapping['iPhone 13Mini.jpg'] || 'iphone-13-mini.jpg'}`,
        `/uploads/${fileMapping['iPhone 13Mini 2.jpg'] || 'iphone-13-mini-2.jpg'}`,
        `/uploads/${fileMapping['iPhone 13Mini 3.jpg'] || 'iphone-13-mini-3.jpg'}`
      ];
    } else if (p.slug === 'apple-iphone-13') {
      p.thumbnail = `/uploads/${fileMapping['iPhone 13Thường.jpg'] || 'iphone-13.jpg'}`;
      p.variants[0].images = [
        `/uploads/${fileMapping['iPhone 13Thường.jpg'] || 'iphone-13.jpg'}`,
        `/uploads/${fileMapping['iPhone 13Thường 2.jpg'] || 'iphone-13-2.jpg'}`
      ];
    } else if (p.slug === 'apple-iphone-15') {
      p.thumbnail = `/uploads/${fileMapping['iPhone 15 Thường.jpg'] || 'iphone-15.jpg'}`;
      p.variants[0].images = [
        `/uploads/${fileMapping['iPhone 15 Thường.jpg'] || 'iphone-15.jpg'}`,
        `/uploads/${fileMapping['iPhone 15 Thường 2.jpg'] || 'iphone-15-2.jpg'}`,
        `/uploads/${fileMapping['iPhone 15 Thường 3.jpg'] || 'iphone-15-3.jpg'}`
      ];
    } else if (p.slug === 'apple-iphone-15-pro-max') {
      p.thumbnail = `/uploads/${fileMapping['iPhone 15PRM 256GB.jpg'] || 'iphone-15-pro-max-256gb.jpg'}`;
      p.variants[0].images = [
        `/uploads/${fileMapping['iPhone 15PRM 256GB.jpg'] || 'iphone-15-pro-max-256gb.jpg'}`
      ];
    } else if (p.slug === 'apple-iphone-11-pro-max') {
      p.thumbnail = `/uploads/${fileMapping['iPhone 11PRM.jpg'] || 'iphone-11-pro-max.jpg'}`;
      p.variants[0].images = [
        `/uploads/${fileMapping['iPhone 11PRM.jpg'] || 'iphone-11-pro-max.jpg'}`,
        `/uploads/${fileMapping['iPhone 11PRM 2.jpg'] || 'iphone-11-pro-max-2.jpg'}`,
        `/uploads/${fileMapping['iPhone 11PRM 3.jpg'] || 'iphone-11-pro-max-3.jpg'}`
      ];
    } else if (p.slug === 'apple-iphone-16-plus') {
      p.thumbnail = `/uploads/${fileMapping['iPhone 16Plus 128GB.jpg'] || 'iphone-16-plus-128gb.jpg'}`;
      p.variants[0].images = [
        `/uploads/${fileMapping['iPhone 16Plus 128GB.jpg'] || 'iphone-16-plus-128gb.jpg'}`,
        `/uploads/${fileMapping['iPhone 16Plus 128GB 2.jpg'] || 'iphone-16-plus-128gb-2.jpg'}`
      ];
    } else if (p.slug === 'dell-latitude-e3301') {
      p.category = 'Tablet';
    }
  }

  // Helper check if product exists in JSON
  const hasProduct = (slug) => products.some(p => p.slug === slug);

  // 4. Định nghĩa và thêm mới sản phẩm
  const newProducts = [
    {
      name: "Dell Latitude E3301",
      slug: "dell-latitude-e3301",
      brand: "Dell",
      category: "Tablet",
      base_price: 15990000,
      sale_price: 13490000,
      thumbnail: `/uploads/${fileMapping['Dell Latitude E3301.jpg'] || 'dell-latitude-e3301.jpg'}`,
      dimensions: { height: 14.9, width: 307.6, thickness: 204.5 },
      design_features: ["Thiết kế kim loại siêu mỏng", "Trọng lượng nhẹ 1.18kg", "Bản lề thông minh nâng bàn phím"],
      material: "Hợp kim nhôm + magie",
      specifications: {
        performance: {
          cpu: "Intel Core i5-8265U",
          gpu: "Intel UHD Graphics 620",
          ram: "8GB LPDDR3",
          rom_options: ["256GB", "512GB"]
        },
        display_camera: {
          screen_tech: "WVA Anti-glare",
          screen_resolution: "1920 x 1080 (FHD)",
          screen_size: "13.3 inch",
          rear_camera: "Không có",
          front_camera: "HD Web Camera"
        },
        battery_charging: {
          battery_capacity: "4-Cell 45Whr",
          charging_tech: "ExpressCharge 65W",
          port_type: "USB-C, HDMI, USB 3.1"
        },
        connectivity: {
          sim: "Không hỗ trợ",
          network: "Wi-Fi 5, Bluetooth 5.0",
          wifi_bluetooth: "Intel Dual Band Wireless, Bluetooth 5.0"
        },
        utilities: {
          security: "Bảo mật vân tay trên nút nguồn",
          special_features: ["Bàn phím đèn nền", "Độ bền chuẩn quân đội MIL-STD-810G"]
        }
      },
      variants: [
        {
          sku: "DEL-LAT-E3301-256G",
          color_name: "Platinum Silver",
          color_code: "#E5E5E5",
          storage: "256GB SSD",
          price: 13490000,
          stock: 10,
          images: [
            `/uploads/${fileMapping['Dell Latitude E3301.jpg'] || 'dell-latitude-e3301.jpg'}`,
            `/uploads/${fileMapping['Dell Latitude E3301 2.jpg'] || 'dell-latitude-e3301-2.jpg'}`,
            `/uploads/${fileMapping['Dell Latitude E3301 3.jpg'] || 'dell-latitude-e3301-3.jpg'}`
          ]
        }
      ],
      description: "Laptop Dell Latitude E3301 là chiếc máy tính xách tay phân khúc doanh nghiệp siêu mỏng nhẹ, độ bền cao, hiệu năng ổn định phù hợp cho học sinh, sinh viên và nhân viên văn phòng.",
      is_active: true,
      is_featured: true,
      seo: {
        meta_title: "Dell Latitude E3301 - Laptop văn phòng mỏng nhẹ",
        meta_description: "Dell Latitude E3301 chính hãng giá tốt, thiết kế vỏ kim loại cao cấp, Core i5 mạnh mẽ."
      },
      ratings: { average_score: 4.6, review_count: 32 }
    },
    {
      name: "Apple iPhone XS",
      slug: "apple-iphone-xs",
      brand: "Apple",
      category: "Smartphone",
      base_price: 11990000,
      sale_price: 6490000,
      thumbnail: `/uploads/${fileMapping['Xs.jpg'] || 'iphone-xs.jpg'}`,
      dimensions: { height: 143.6, width: 70.9, thickness: 7.7 },
      design_features: ["Khung thép không gỉ bóng bẩy", "Mặt kính cường lực cao cấp", "Chống nước IP68"],
      material: "Thép không gỉ, kính",
      specifications: {
        performance: {
          cpu: "Apple A12 Bionic",
          gpu: "Apple GPU 4-core",
          ram: "4GB",
          rom_options: ["64GB", "256GB"]
        },
        display_camera: {
          screen_tech: "Super Retina OLED",
          screen_resolution: "2436 x 1125",
          screen_size: "5.8 inch",
          rear_camera: "12MP + 12MP",
          front_camera: "7MP"
        },
        battery_charging: {
          battery_capacity: "2658mAh",
          charging_tech: "Sạc nhanh 15W, sạc không dây Qi",
          port_type: "Lightning"
        },
        connectivity: {
          sim: "1 Nano + 1 eSIM",
          network: "4G LTE",
          wifi_bluetooth: "Wi-Fi 5, Bluetooth 5.0"
        },
        utilities: {
          security: "Face ID",
          special_features: ["Smart HDR", "3D Touch"]
        }
      },
      variants: [
        {
          sku: "APL-IPXS-64GD",
          color_name: "Gold",
          color_code: "#D4AF37",
          storage: "64GB",
          price: 6490000,
          stock: 15,
          images: [
            `/uploads/${fileMapping['Xs.jpg'] || 'iphone-xs.jpg'}`,
            `/uploads/${fileMapping['Xs 2.jpg'] || 'iphone-xs-2.jpg'}`,
            `/uploads/${fileMapping['Xs 3.jpg'] || 'iphone-xs-3.jpg'}`
          ]
        }
      ],
      description: "iPhone XS mang lại màn hình OLED sắc nét, thiết kế khung thép cầm nắm đầm tay và hệ thống camera kép chụp chân dung đỉnh cao.",
      is_active: true,
      is_featured: false,
      seo: {
        meta_title: "Apple iPhone XS - Cửa hàng Minh Khang",
        meta_description: "Mua iPhone XS cũ giá rẻ, nguyên bản, bảo hành dài hạn."
      },
      ratings: { average_score: 4.5, review_count: 145 }
    },
    {
      name: "Apple iPhone 12",
      slug: "apple-iphone-12",
      brand: "Apple",
      category: "Smartphone",
      base_price: 15990000,
      sale_price: 11490000,
      thumbnail: `/uploads/${fileMapping['iPhone 12.jpg'] || 'iphone-12.jpg'}`,
      dimensions: { height: 146.7, width: 71.5, thickness: 7.4 },
      design_features: ["Cạnh phẳng vuông vức", "Mặt trước Ceramic Shield siêu bền", "Mặt lưng kính bóng bẩy"],
      material: "Nhôm hàng không, kính",
      specifications: {
        performance: {
          cpu: "Apple A14 Bionic",
          gpu: "Apple GPU 4-core",
          ram: "4GB",
          rom_options: ["64GB", "128GB"]
        },
        display_camera: {
          screen_tech: "Super Retina XDR OLED",
          screen_resolution: "2532 x 1170",
          screen_size: "6.1 inch",
          rear_camera: "12MP + 12MP",
          front_camera: "12MP"
        },
        battery_charging: {
          battery_capacity: "2815mAh",
          charging_tech: "Sạc nhanh 20W, MagSafe 15W",
          port_type: "Lightning"
        },
        connectivity: {
          sim: "1 Nano + 1 eSIM",
          network: "5G",
          wifi_bluetooth: "Wi-Fi 6, Bluetooth 5.0"
        },
        utilities: {
          security: "Face ID",
          special_features: ["Chế độ ban đêm trên mọi camera", "Quay video HDR Dolby Vision"]
        }
      },
      variants: [
        {
          sku: "APL-IP12-64BK",
          color_name: "Black",
          color_code: "#121212",
          storage: "64GB",
          price: 11490000,
          stock: 20,
          images: [
            `/uploads/${fileMapping['iPhone 12.jpg'] || 'iphone-12.jpg'}`,
            `/uploads/${fileMapping['iPhone 12 2.jpg'] || 'iphone-12-2.jpg'}`,
            `/uploads/${fileMapping['iPhone 12 3.jpg'] || 'iphone-12-3.jpg'}`,
            `/uploads/${fileMapping['iPhone 12 4.jpg'] || 'iphone-12-4.jpg'}`
          ]
        }
      ],
      description: "iPhone 12 đánh dấu sự trở lại của thiết kế viền vuông sang trọng, hỗ trợ kết nối 5G siêu tốc và chip A14 Bionic mạnh mẽ.",
      is_active: true,
      is_featured: false,
      seo: {
        meta_title: "Apple iPhone 12 - Giá tốt nhất hôm nay",
        meta_description: "Sở hữu ngay iPhone 12 chính hãng, thiết kế viền vuông thời thượng, màn hình OLED rực rỡ."
      },
      ratings: { average_score: 4.7, review_count: 320 }
    },
    {
      name: "Apple iPhone 14 Plus",
      slug: "apple-iphone-14-plus",
      brand: "Apple",
      category: "Smartphone",
      base_price: 21990000,
      sale_price: 18490000,
      thumbnail: `/uploads/${fileMapping['iPhone 14Plus.jpg'] || 'iphone-14-plus.jpg'}`,
      dimensions: { height: 160.8, width: 78.1, thickness: 7.8 },
      design_features: ["Màn hình lớn 6.7 inch", "Thời lượng pin dài nhất dòng iPhone", "Khung nhôm trọng lượng tối ưu"],
      material: "Nhôm, kính",
      specifications: {
        performance: {
          cpu: "Apple A15 Bionic (5-core GPU)",
          gpu: "Apple GPU 5-core",
          ram: "6GB",
          rom_options: ["128GB", "256GB"]
        },
        display_camera: {
          screen_tech: "Super Retina XDR OLED",
          screen_resolution: "2778 x 1284",
          screen_size: "6.7 inch",
          rear_camera: "12MP + 12MP",
          front_camera: "12MP (Tự động lấy nét)"
        },
        battery_charging: {
          battery_capacity: "4325mAh",
          charging_tech: "Sạc nhanh 20W, MagSafe 15W",
          port_type: "Lightning"
        },
        connectivity: {
          sim: "1 Nano + 1 eSIM",
          network: "5G",
          wifi_bluetooth: "Wi-Fi 6, Bluetooth 5.3"
        },
        utilities: {
          security: "Face ID",
          special_features: ["Action Mode quay video siêu mượt", "Phát hiện va chạm thông minh"]
        }
      },
      variants: [
        {
          sku: "APL-IP14PL-128BL",
          color_name: "Blue",
          color_code: "#A2B5CD",
          storage: "128GB",
          price: 18490000,
          stock: 12,
          images: [
            `/uploads/${fileMapping['iPhone 14Plus.jpg'] || 'iphone-14-plus.jpg'}`,
            `/uploads/${fileMapping['iPhone 14Plus 2.jpg'] || 'iphone-14-plus-2.jpg'}`,
            `/uploads/${fileMapping['iPhone 14Plus 3.jpg'] || 'iphone-14-plus-3.jpg'}`
          ]
        }
      ],
      description: "iPhone 14 Plus mang lại trải nghiệm màn hình siêu lớn và thời lượng pin cực khủng trong một thiết kế mỏng nhẹ, dễ dàng sử dụng cả ngày.",
      is_active: true,
      is_featured: true,
      seo: {
        meta_title: "Apple iPhone 14 Plus - Màn hình lớn, pin trâu",
        meta_description: "Mua iPhone 14 Plus chính hãng VN/A tại Minh Khang Store với giá tốt nhất thị trường."
      },
      ratings: { average_score: 4.8, review_count: 86 }
    },
    {
      name: "Apple iPhone 14 Pro",
      slug: "apple-iphone-14-pro",
      brand: "Apple",
      category: "Smartphone",
      base_price: 25990000,
      sale_price: 21990000,
      thumbnail: `/uploads/${fileMapping['iPhone 14Pro.jpg'] || 'iphone-14-pro.jpg'}`,
      dimensions: { height: 147.5, width: 71.5, thickness: 7.85 },
      design_features: ["Dynamic Island thông minh", "Màn hình Always-on Display", "Khung thép không gỉ nhám"],
      material: "Thép không gỉ, kính mờ",
      specifications: {
        performance: {
          cpu: "Apple A16 Bionic",
          gpu: "Apple GPU 5-core",
          ram: "6GB",
          rom_options: ["128GB", "256GB"]
        },
        display_camera: {
          screen_tech: "LTPO Super Retina XDR",
          screen_resolution: "2556 x 1179",
          screen_size: "6.1 inch",
          rear_camera: "48MP + 12MP + 12MP (Zoom 3x)",
          front_camera: "12MP (Có OIS)"
        },
        battery_charging: {
          battery_capacity: "3200mAh",
          charging_tech: "Sạc nhanh 20W, MagSafe 15W",
          port_type: "Lightning"
        },
        connectivity: {
          sim: "1 Nano + 1 eSIM",
          network: "5G",
          wifi_bluetooth: "Wi-Fi 6, Bluetooth 5.3"
        },
        utilities: {
          security: "Face ID",
          special_features: ["Camera 48MP ProRAW", "Dynamic Island tương tác"]
        }
      },
      variants: [
        {
          sku: "APL-IP14P-128BK",
          color_name: "Space Black",
          color_code: "#232323",
          storage: "128GB",
          price: 21990000,
          stock: 15,
          images: [
            `/uploads/${fileMapping['iPhone 14Pro.jpg'] || 'iphone-14-pro.jpg'}`,
            `/uploads/${fileMapping['iPhone 14Pro 2.jpg'] || 'iphone-14-pro-2.jpg'}`,
            `/uploads/${fileMapping['iPhone 14Pro 3.jpg'] || 'iphone-14-pro-3.jpg'}`
          ]
        }
      ],
      description: "iPhone 14 Pro sở hữu Dynamic Island đột phá cùng cảm biến camera 48MP nâng tầm chụp ảnh chuyên nghiệp và chip xử lý A16 Bionic mạnh mẽ.",
      is_active: true,
      is_featured: true,
      seo: {
        meta_title: "Apple iPhone 14 Pro - Dynamic Island đỉnh cao",
        meta_description: "Mua iPhone 14 Pro chính hãng VN/A giá tốt, hỗ trợ trả góp 0% tại Minh Khang Store."
      },
      ratings: { average_score: 4.8, review_count: 112 }
    },
    {
      name: "Apple iPhone 15 Pro",
      slug: "apple-iphone-15-pro",
      brand: "Apple",
      category: "Smartphone",
      base_price: 28990000,
      sale_price: 24990000,
      thumbnail: `/uploads/${fileMapping['iPhone 15Pro 256GB.jpg'] || 'iphone-15-pro-256gb.jpg'}`,
      dimensions: { height: 146.6, width: 70.6, thickness: 8.25 },
      design_features: ["Khung Titanium siêu nhẹ", "Nút Action Button đa năng", "Cổng sạc USB-C siêu tốc"],
      material: "Titanium cấp vũ trụ, kính mờ",
      specifications: {
        performance: {
          cpu: "Apple A17 Pro",
          gpu: "Apple GPU 6-core",
          ram: "8GB",
          rom_options: ["128GB", "256GB"]
        },
        display_camera: {
          screen_tech: "LTPO Super Retina XDR",
          screen_resolution: "2556 x 1179",
          screen_size: "6.1 inch",
          rear_camera: "48MP + 12MP + 12MP (Zoom 3x)",
          front_camera: "12MP"
        },
        battery_charging: {
          battery_capacity: "3274mAh",
          charging_tech: "Sạc USB-C 25W, MagSafe 15W",
          port_type: "USB-C (Chuẩn USB 3 tốc độ 10Gbps)"
        },
        connectivity: {
          sim: "2 eSIM hoặc 1 Nano + 1 eSIM",
          network: "5G",
          wifi_bluetooth: "Wi-Fi 6E, Bluetooth 5.3"
        },
        utilities: {
          security: "Face ID",
          special_features: ["Nút Action Button tùy chỉnh", "Ray tracing phần cứng chơi game console"]
        }
      },
      variants: [
        {
          sku: "APL-IP15P-256NT",
          color_name: "Natural Titanium",
          color_code: "#A8A9AD",
          storage: "256GB",
          price: 24990000,
          stock: 15,
          images: [
            `/uploads/${fileMapping['iPhone 15Pro 256GB.jpg'] || 'iphone-15-pro-256gb.jpg'}`
          ]
        }
      ],
      description: "iPhone 15 Pro là dòng sản phẩm đầu tiên dùng khung vỏ Titan siêu bền nhẹ, trang bị chip 3nm A17 Pro mang lại hiệu năng đồ họa đột phá.",
      is_active: true,
      is_featured: true,
      seo: {
        meta_title: "Apple iPhone 15 Pro - Titanium siêu nhẹ",
        meta_description: "iPhone 15 Pro chính hãng màu Titan tự nhiên, dung lượng 256GB, giá tốt nhất."
      },
      ratings: { average_score: 4.8, review_count: 98 }
    },
    {
      name: "Apple iPhone 16 Pro Max",
      slug: "apple-iphone-16-pro-max",
      brand: "Apple",
      category: "Smartphone",
      base_price: 34990000,
      sale_price: 31990000,
      thumbnail: `/uploads/${fileMapping['iPhone 16PRM 256GB.jpg'] || 'iphone-16-pro-max-256gb.jpg'}`,
      dimensions: { height: 163.0, width: 77.6, thickness: 8.25 },
      design_features: ["Màn hình cực lớn 6.9 inch viền siêu mỏng", "Nút Camera Control cảm ứng lực", "Khung Titanium cấp 5 hoàn thiện mới"],
      material: "Titanium đánh bóng nhẹ, kính Ceramic Shield thế hệ mới nhất",
      specifications: {
        performance: {
          cpu: "Apple A18 Pro",
          gpu: "Apple GPU 6-core",
          ram: "8GB",
          rom_options: ["256GB", "512GB", "1TB"]
        },
        display_camera: {
          screen_tech: "Super Retina XDR OLED ProMotion 120Hz",
          screen_resolution: "2868 x 1320",
          screen_size: "6.9 inch",
          rear_camera: "48MP Fusion + 48MP UltraWide + 12MP Telephoto (Zoom 5x)",
          front_camera: "12MP TrueDepth"
        },
        battery_charging: {
          battery_capacity: "4685mAh",
          charging_tech: "Sạc USB-C 30W, MagSafe 25W",
          port_type: "USB-C (Chuẩn USB 3)"
        },
        connectivity: {
          sim: "2 eSIM",
          network: "5G (Băng tần siêu rộng)",
          wifi_bluetooth: "Wi-Fi 7, Bluetooth 5.4"
        },
        utilities: {
          security: "Face ID",
          special_features: ["Apple Intelligence (AI tích hợp)", "Nút điều khiển camera chuyên biệt", "Quay phim 4K 120fps Dolby Vision"]
        }
      },
      variants: [
        {
          sku: "APL-IP16PM-256DT",
          color_name: "Desert Titanium",
          color_code: "#C7B49F",
          storage: "256GB",
          price: 31990000,
          stock: 30,
          images: [
            `/uploads/${fileMapping['iPhone 16PRM 256GB.jpg'] || 'iphone-16-pro-max-256gb.jpg'}`
          ]
        }
      ],
      description: "iPhone 16 Pro Max sở hữu màn hình 6.9 inch cực đại, trang bị chip A18 Pro mạnh mẽ và bộ điều khiển camera thông minh mang lại trải nghiệm sáng tạo đỉnh cao.",
      is_active: true,
      is_featured: true,
      seo: {
        meta_title: "Apple iPhone 16 Pro Max - Siêu phẩm đỉnh cao 2026",
        meta_description: "Đặt hàng iPhone 16 Pro Max chính hãng tại Minh Khang Store, nhận ưu đãi độc quyền."
      },
      ratings: { average_score: 4.9, review_count: 24 }
    },
    {
      name: "Apple iPhone 16 Pro",
      slug: "apple-iphone-16-pro",
      brand: "Apple",
      category: "Smartphone",
      base_price: 28990000,
      sale_price: 26990000,
      thumbnail: `/uploads/${fileMapping['iPhone 16Pro 128GB Và 256GB.jpg'] || 'iphone-16-pro-128gb-256gb.jpg'}`,
      dimensions: { height: 149.6, width: 71.5, thickness: 8.25 },
      design_features: ["Màn hình 6.3 inch viền siêu mỏng", "Nút điều khiển Camera Control", "Khung Titanium hoàn thiện cao cấp"],
      material: "Titanium, kính Ceramic Shield thế hệ mới",
      specifications: {
        performance: {
          cpu: "Apple A18 Pro",
          gpu: "Apple GPU 6-core",
          ram: "8GB",
          rom_options: ["128GB", "256GB"]
        },
        display_camera: {
          screen_tech: "Super Retina XDR OLED ProMotion 120Hz",
          screen_resolution: "2622 x 1206",
          screen_size: "6.3 inch",
          rear_camera: "48MP Fusion + 48MP UltraWide + 12MP Telephoto (Zoom 5x)",
          front_camera: "12MP TrueDepth"
        },
        battery_charging: {
          battery_capacity: "3582mAh",
          charging_tech: "Sạc nhanh USB-C 30W, MagSafe 25W",
          port_type: "USB-C"
        },
        connectivity: {
          sim: "2 eSIM",
          network: "5G",
          wifi_bluetooth: "Wi-Fi 7, Bluetooth 5.4"
        },
        utilities: {
          security: "Face ID",
          special_features: ["Hệ thống Apple Intelligence", "Bộ điều khiển camera thế hệ mới", "Zoom quang học 5x chuyên nghiệp"]
        }
      },
      variants: [
        {
          sku: "APL-IP16P-128DT",
          color_name: "Desert Titanium",
          color_code: "#C7B49F",
          storage: "128GB",
          price: 26990000,
          stock: 20,
          images: [
            `/uploads/${fileMapping['iPhone 16Pro 128GB Và 256GB.jpg'] || 'iphone-16-pro-128gb-256gb.jpg'}`,
            `/uploads/${fileMapping['iPhone 16Pro 128GB Và 256GB 2.jpg'] || 'iphone-16-pro-128gb-256gb-2.jpg'}`
          ]
        }
      ],
      description: "iPhone 16 Pro mang camera siêu Zoom 5x cao cấp lên kích thước 6.3 inch nhỏ gọn cùng với chip A18 Pro hỗ trợ đầy đủ các tính năng AI thông minh.",
      is_active: true,
      is_featured: true,
      seo: {
        meta_title: "Apple iPhone 16 Pro - Đỉnh cao công nghệ 6.3 inch",
        meta_description: "Mua ngay iPhone 16 Pro chính hãng giá cực tốt tại Minh Khang Store."
      },
      ratings: { average_score: 4.8, review_count: 36 }
    },
    {
      name: "Apple iPhone 16",
      slug: "apple-iphone-16",
      brand: "Apple",
      category: "Smartphone",
      base_price: 22990000,
      sale_price: 20990000,
      thumbnail: `/uploads/${fileMapping['iPhone 16Thường 128GB.jpg'] || 'iphone-16-128gb.jpg'}`,
      dimensions: { height: 147.6, width: 71.6, thickness: 7.8 },
      design_features: ["Camera xếp dọc độc đáo", "Hỗ trợ quay Video không gian (Spatial)", "Nút bấm Camera Control cảm ứng"],
      material: "Nhôm tái chế, kính cường lực pha màu độc đáo",
      specifications: {
        performance: {
          cpu: "Apple A18 Bionic",
          gpu: "Apple GPU 5-core",
          ram: "8GB",
          rom_options: ["128GB", "256GB"]
        },
        display_camera: {
          screen_tech: "Super Retina XDR OLED",
          screen_resolution: "2556 x 1179",
          screen_size: "6.1 inch",
          rear_camera: "48MP Fusion + 12MP UltraWide (Chụp cận cảnh macro)",
          front_camera: "12MP TrueDepth"
        },
        battery_charging: {
          battery_capacity: "3561mAh",
          charging_tech: "Sạc nhanh USB-C 25W, MagSafe 25W",
          port_type: "USB-C"
        },
        connectivity: {
          sim: "2 eSIM",
          network: "5G",
          wifi_bluetooth: "Wi-Fi 7, Bluetooth 5.3"
        },
        utilities: {
          security: "Face ID",
          special_features: ["Apple Intelligence", "Nút Camera Control tiện lợi", "Chụp ảnh siêu cận Macro"]
        }
      },
      variants: [
        {
          sku: "APL-IP16-128BK",
          color_name: "Black",
          color_code: "#121212",
          storage: "128GB",
          price: 20990000,
          stock: 25,
          images: [
            `/uploads/${fileMapping['iPhone 16Thường 128GB.jpg'] || 'iphone-16-128gb.jpg'}`,
            `/uploads/${fileMapping['iPhone 16Thường 128GB 2.jpg'] || 'iphone-16-128gb-2.jpg'}`,
            `/uploads/${fileMapping['iPhone 16Thường 128GB 3.jpg'] || 'iphone-16-128gb-3.jpg'}`
          ]
        }
      ],
      description: "iPhone 16 tiêu chuẩn được trang bị bộ nhớ RAM 8GB giúp vận hành trơn tru Apple Intelligence, thiết kế camera đặt dọc hỗ trợ chụp quay Spatial và nút điều khiển camera độc quyền.",
      is_active: true,
      is_featured: true,
      seo: {
        meta_title: "Apple iPhone 16 - Hỗ trợ AI tối tân",
        meta_description: "iPhone 16 chính hãng VN/A giá tốt, đủ màu sắc thời thượng tại Minh Khang Store."
      },
      ratings: { average_score: 4.8, review_count: 52 }
    }
  ];

  for (const newP of newProducts) {
    if (!hasProduct(newP.slug)) {
      products.push(newP);
      console.log(`Đã thêm mới sản phẩm: "${newP.name}"`);
    } else {
      console.log(`Sản phẩm đã tồn tại trong danh sách: "${newP.name}". Bỏ qua.`);
    }
  }

  // 5. Lưu lại dữ liệu mới vào JSON
  fs.writeFileSync(jsonPath, JSON.stringify(products, null, 4), 'utf8');
  console.log('--- Đã cập nhật file JSON cơ sở dữ liệu thành công! ---');
}

run().catch(err => {
  console.error('Đã xảy ra lỗi trong quá trình xử lý:', err);
  process.exit(1);
});
