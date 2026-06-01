const fetch = global.fetch || require('node-fetch');
const candidates = {
  'Samsung Galaxy S24 Ultra': [
    'https://images.samsung.com/is/image/samsung/p6pim/vn/2401/gallery/vn-galaxy-s24-s928-sm-s928bzkhxxv-thumb-539573760',
    'https://images.samsung.com/is/image/samsung/p6pim/vn/2401/gallery/vn-galaxy-s24-s928-sm-s928bzkhxxv-530424684',
    'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-1.jpg',
    'https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s24-ultra-2.jpg'
  ],
  'Apple iPhone 15 Pro Max': [
    'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg',
    'https://www.apple.com/newsroom/images/product/iphone/standard/Apple_iPhone-15-Pro_Max_09122023_big.jpg.landing-grid-2x.jpg'
  ],
  'Xiaomi Redmi Note 13 Pro': [
    'https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-redmi-note-13-pro-1.jpg',
    'https://fdn2.gsmarena.com/vv/pics/xiaomi/xiaomi-redmi-note-13-pro-2.jpg'
  ],
  'Vivo X90 Pro': [
    'https://fdn2.gsmarena.com/vv/pics/vivo/vivo-x90-pro-1.jpg',
    'https://fdn2.gsmarena.com/vv/pics/vivo/vivo-x90-pro-2.jpg'
  ],
  'OPPO Find X7': [
    'https://fdn2.gsmarena.com/vv/pics/oppo/oppo-find-x7-1.jpg',
    'https://fdn2.gsmarena.com/vv/pics/oppo/oppo-find-x7-2.jpg'
  ],
  'Apple iPhone 16 Plus': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
    'https://images.unsplash.com/photo-1510552776732-7197f0f2d403'
  ],
  'Apple iPhone 13 mini': [
    'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-13-mini-1.jpg',
    'https://images.unsplash.com/photo-1512499617640-c2f999358188'
  ],
  'Apple iPhone 11 Pro Max': [
    'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-11-pro-max-1.jpg',
    'https://images.unsplash.com/photo-1510552776732-7197f0f2d403'
  ],
  'Apple iPhone SE (2022)': [
    'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-se-2022-1.jpg',
    'https://images.unsplash.com/photo-1526045612212-70caf35c14df'
  ],
  'Apple iPhone 15': [
    'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-1.jpg',
    'https://images.unsplash.com/photo-1567016428616-15b653542c3c'
  ],
  'Apple iPhone 14 Pro Max': [
    'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-14-pro-max-1.jpg',
    'https://images.unsplash.com/photo-1510552776732-7197f0f2d403'
  ],
  'Apple iPhone 13': [
    'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-13-01.jpg',
    'https://images.unsplash.com/photo-1510552776732-7197f0f2d403'
  ],
  'Apple iPhone 12 Pro Max': [
    'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-12-pro-max-1.jpg',
    'https://images.unsplash.com/photo-1512499617640-c2f999358188'
  ],
  'Apple iPhone XS Max': [
    'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-xs-max-5.jpg',
    'https://images.unsplash.com/photo-1512499617640-c2f999358188'
  ],
  'Apple iPhone XR': [
    'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-xr-new-1.jpg',
    'https://images.unsplash.com/photo-1526045612212-70caf35c14df'
  ]
};

const checkUrl = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { url, ok: res.ok, status: res.status };
  } catch (e) {
    return { url, ok: false, status: e.message };
  }
};

(async () => {
  for (const [name, urls] of Object.entries(candidates)) {
    console.log(`\n=== ${name} ===`);
    for (const url of urls) {
      const result = await checkUrl(url);
      console.log(result.ok ? 'OK ' : 'BAD', result.status, url);
    }
  }
})();
