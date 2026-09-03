const { Router } = require('express');
const {
  getProductos,
  getProductoById,
  new_bulk,
  createProducto,
  createProductos,
  updateProducto,
  deleteProducto
} = require('../controllers/productos.controller');

const router = Router();

router.get('/', getProductos);
router.get('/new_bulk', new_bulk);
router.get('/:id', getProductoById);
router.post('/', createProducto);
router.post('/bulk', createProductos);
router.put('/:id', updateProducto);
router.delete('/:id', deleteProducto);

module.exports = router;