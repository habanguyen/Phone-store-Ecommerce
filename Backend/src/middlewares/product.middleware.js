const parseJsonField = (value) => {
  if (typeof value === 'string' && value.trim()) {
    return JSON.parse(value);
  }
  return value;
};

const validateProductPayload = (req, res, next) => {
  try {
    const { name, brand, category, description, variants, existingImages } = req.body;

    if (!name?.toString().trim()) {
      throw new Error('Product name is required.');
    }
    if (!brand?.toString().trim()) {
      throw new Error('Product brand is required.');
    }
    if (!category?.toString().trim()) {
      throw new Error('Product category is required.');
    }
    if (!description?.toString().trim()) {
      throw new Error('Product description is required.');
    }

    let parsedVariants = parseJsonField(variants);
    if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
      throw new Error('Product variants are required and must be an array.');
    }

    parsedVariants = parsedVariants.map((variant, index) => {
      if (!variant || typeof variant !== 'object') {
        throw new Error(`Variant at index ${index} is invalid.`);
      }

      const storage = variant.storage?.toString().trim();
      const color = variant.color?.toString().trim();
      const price = Number(variant.price);
      const stock = Number(variant.stock);

      if (!storage) {
        throw new Error(`Variant at index ${index} requires storage.`);
      }
      if (!color) {
        throw new Error(`Variant at index ${index} requires color.`);
      }
      if (Number.isNaN(price) || price < 0) {
        throw new Error(`Variant at index ${index} requires a valid price.`);
      }
      if (Number.isNaN(stock) || stock < 0) {
        throw new Error(`Variant at index ${index} requires a valid stock quantity.`);
      }

      return {
        ...variant,
        storage,
        color,
        price,
        stock,
        sku: variant.sku?.toString().trim() || `${storage}-${color}`
      };
    });

    req.body.variants = parsedVariants;
    req.body.existingImages = parseJsonField(existingImages) || [];

    if (!Array.isArray(req.body.existingImages)) {
      throw new Error('existingImages must be an array of image URLs if provided.');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateProductPayload
};
