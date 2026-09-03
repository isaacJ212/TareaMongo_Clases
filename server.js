const express = require('express');
require('dotenv').config();

const productoRoutes = require('./mi_tienda/src/routes/productos.routes');
const ventaRoutes = require('./mi_tienda/src/routes/venta.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'API de MongoDB funcionando',
    endpoints: {
      productos: '/api/productos',
      ventas: '/api/ventas'
    }
  });
});

app.use('/api/productos', productoRoutes);
app.use('/api/ventas', ventaRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
