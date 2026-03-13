import app from './app/app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { modelsApp } from './config/models.app.js';
import Categoria from './models/categoria.model.js';
import Producto from './models/producto.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
modelsApp(false);

// Insertar categorías iniciales
const insertInitialCategories = async () => {
  try {
    const categories = [
      'Alimentos para perros',
      'Alimentos para gatos',
      'Accesorios para paseo',
      'Cuidado e higiene',
      'Juguetes para perros',
      'Juguetes para gatos',
      'Medicamentos veterinarios',
      'Snacks y premios',
      'Ropa y accesorios de moda',
      'Camas y descanso',
      'Transporte y viajes',
      'Entrenamiento y obediencia',
      'Peces y acuarios',
      'Aves y jaulas',
      'Roedores y pequeños mamíferos',
      'Reptiles y terrarios',
      'Accesorios de limpieza',
      'Cosmética y cuidado estético',
      'Suplementos alimenticios',
      'Otros productos para mascotas'
    ];

    const categoryStates = [
      'activo', 'activo', 'activo', 'activo', 'activo', 'activo', 'activo', 'activo',
      'inactivo', 'activo', 'activo', 'inactivo', 'activo', 'activo', 'activo',
      'activo', 'activo', 'inactivo', 'activo', 'activo'
    ];

    for (let i = 0; i < categories.length; i++) {
      await Categoria.findOrCreate({
        where: { nombre_categoria: categories[i] },
        defaults: {
          nombre_categoria: categories[i],
          estado: categoryStates[i]
        }
      });
    }

    console.log('Categorías iniciales insertadas correctamente');
  } catch (error) {
    console.error('Error insertando categorías iniciales:', error);
  }
};

// Insertar productos iniciales con precios en COP
const insertInitialProducts = async () => {
  try {
    // Obtener IDs reales de las categorías
    const categories = await Categoria.findAll({
      attributes: ['id_categoria', 'nombre_categoria']
    });

    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.nombre_categoria] = cat.id_categoria;
    });

    const products = [
      { sku: 'SKU-C001', name: 'Croquetas para perros adulto 5kg', stock: 50, usdPrice: 35.99, presentation: 'Bolsa 5 kg', categoryName: 'Alimentos para perros' },
      { sku: 'SKU-C002', name: 'Alimento húmedo para gatos 400g', stock: 100, usdPrice: 12.50, presentation: 'Lata 400 g', categoryName: 'Alimentos para gatos' },
      { sku: 'SKU-C003', name: 'Snack dental para perros 150g', stock: 75, usdPrice: 8.99, presentation: 'Paquete 150 g', categoryName: 'Alimentos para perros' },
      { sku: 'SKU-A001', name: 'Collar ajustable para perros', stock: 40, usdPrice: 15.00, presentation: 'Unidad', categoryName: 'Accesorios para paseo' },
      { sku: 'SKU-A002', name: 'Juguete de cuerda para mascotas', stock: 60, usdPrice: 9.50, presentation: 'Unidad', categoryName: 'Juguetes para perros' },
      { sku: 'SKU-A003', name: 'Cama ortopédica para perros medianos', stock: 20, usdPrice: 120.00, presentation: 'Unidad', categoryName: 'Camas y descanso' },
      { sku: 'SKU-L001', name: 'Champú antipulgas para perros 500ml', stock: 80, usdPrice: 18.00, presentation: 'Botella 500 ml', categoryName: 'Cuidado e higiene' },
      { sku: 'SKU-L002', name: 'Arena para gatos perfumada 10kg', stock: 30, usdPrice: 25.50, presentation: 'Bolsa 10 kg', categoryName: 'Alimentos para gatos' },
      { sku: 'SKU-L003', name: 'Toallitas húmedas para mascotas 100 uds', stock: 100, usdPrice: 7.99, presentation: 'Paquete 100 uds', categoryName: 'Accesorios de limpieza' },
      { sku: 'SKU-C004', name: 'Comida para peces perros 200g', stock: 60, usdPrice: 5.99, presentation: 'Paquete 200 g', categoryName: 'Alimentos para perros' },
      { sku: 'SKU-A004', name: 'Transportadora para gatos pequeña', stock: 15, usdPrice: 45.00, presentation: 'Unidad', categoryName: 'Transporte y viajes' },
      { sku: 'SKU-C005', name: 'Comida para gatos 1kg', stock: 40, usdPrice: 14.00, presentation: 'Bolsa 1 kg', categoryName: 'Alimentos para gatos' },
      { sku: 'SKU-L004', name: 'Desodorante para mascotas spray 250ml', stock: 50, usdPrice: 12.00, presentation: 'Spray 250 ml', categoryName: 'Cuidado e higiene' },
      { sku: 'SKU-A005', name: 'Rascador para gatos mediano', stock: 25, usdPrice: 35.00, presentation: 'Unidad', categoryName: 'Juguetes para gatos' },
      { sku: 'SKU-C006', name: 'Leche para cachorros 1L', stock: 30, usdPrice: 20.00, presentation: 'Botella 1 L', categoryName: 'Alimentos para perros' },
      { sku: 'SKU-L005', name: 'Cepillo para eliminación de pelo', stock: 70, usdPrice: 10.50, presentation: 'Unidad', categoryName: 'Cuidado e higiene' },
      { sku: 'SKU-A006', name: 'Correa retráctil para perros 5m', stock: 45, usdPrice: 22.00, presentation: 'Unidad', categoryName: 'Accesorios para paseo' },
      { sku: 'SKU-C007', name: 'Alimento balanceado para gatos 500g', stock: 55, usdPrice: 9.00, presentation: 'Bolsa 500 g', categoryName: 'Alimentos para gatos' },
      { sku: 'SKU-L006', name: 'Limpiador de oídos para mascotas 100ml', stock: 35, usdPrice: 14.00, presentation: 'Botella 100 ml', categoryName: 'Cuidado e higiene' },
      { sku: 'SKU-A007', name: 'Comedero automático para perros 3L', stock: 10, usdPrice: 60.00, presentation: 'Unidad', categoryName: 'Accesorios para paseo' }
    ];

    // Tasa de cambio aproximada USD a COP
    const exchangeRate = 4000;

    for (const product of products) {
      const copPrice = Math.round(product.usdPrice * exchangeRate);
      const categoryId = categoryMap[product.categoryName];

      if (!categoryId) {
        console.warn(`Categoría no encontrada: ${product.categoryName} para producto ${product.sku}`);
        continue;
      }

      await Producto.findOrCreate({
        where: { codigo_sku: product.sku },
        defaults: {
          codigo_sku: product.sku,
          nombre_producto: product.name,
          stock: product.stock,
          precio_unitario: copPrice,
          presentacion_producto: product.presentation,
          estado: 'activo',
          id_categoria: categoryId
        }
      });
    }

    console.log('Productos iniciales insertados correctamente con precios en COP');
  } catch (error) {
    console.error('Error insertando productos iniciales:', error);
  }
};

// Ejecutar seed inicial si se activa por entorno
if (process.env.SEED_ON_START === 'true') {
  setTimeout(async () => {
    await insertInitialCategories();
    await insertInitialProducts();
  }, 2000);
}

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`conected Server ${port}`);
});

