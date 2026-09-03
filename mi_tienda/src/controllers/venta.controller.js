const { conectarDB, client, supportsTransactions } = require('../config/database');
const { ObjectId } = require('mongodb');

const realizarVenta = async (req, res) => {
  const session = client.startSession();
  let useTransactions = !!supportsTransactions();

  try {
    const db = await conectarDB();

    if (useTransactions) {
      try {
        session.startTransaction();
      } catch (err) {
        
        useTransactions = false;
      }
    }

    const { productoId, cantidad } = req.body;

    if (!ObjectId.isValid(productoId) || !cantidad || Number(cantidad) <= 0) {
      if (useTransactions) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Datos de venta inválidos' });
    }

    const findOpts = useTransactions ? { session } : {};
    const producto = await db.collection('productos').findOne(
      { _id: new ObjectId(productoId) },
      findOpts
    );

    if (!producto) {
      if (useTransactions) await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (producto.stock < Number(cantidad)) {
      if (useTransactions) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${producto.stock}`
      });
    }

    if (useTransactions) {
      await db.collection('productos').updateOne(
        { _id: new ObjectId(productoId) },
        { $inc: { stock: -Number(cantidad) } },
        { session }
      );

      const nuevaVenta = {
        productoId: new ObjectId(productoId),
        nombreProducto: producto.nombre,
        cantidadVendida: Number(cantidad),
        precioUnitario: producto.precio,
        total: producto.precio * Number(cantidad),
        fecha: new Date()
      };

      const resultadoVenta = await db.collection('ventas').insertOne(nuevaVenta, { session });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        mensaje: '¡Venta registrada con éxito bajo control ACID!',
        ventaId: resultadoVenta.insertedId
      });
    } else {
      try {

        const updateResult = await db.collection('productos').updateOne(
          { _id: new ObjectId(productoId), stock: { $gte: Number(cantidad) } },
          { $inc: { stock: -Number(cantidad) } }
        );

        if (updateResult.matchedCount === 0) {
          return res.status(400).json({ error: 'Stock insuficiente o producto no encontrado' });
        }

        const nuevaVenta = {
          productoId: new ObjectId(productoId),
          nombreProducto: producto.nombre,
          cantidadVendida: Number(cantidad),
          precioUnitario: producto.precio,
          total: producto.precio * Number(cantidad),
          fecha: new Date()
        };

        const resultadoVenta = await db.collection('ventas').insertOne(nuevaVenta);

        return res.status(201).json({
          mensaje: 'Venta registrada (sin soporte de transacciones en este servidor)',
          ventaId: resultadoVenta.insertedId
        });
      } catch (err) {

        try {
          await db.collection('productos').updateOne(
            { _id: new ObjectId(productoId) },
            { $inc: { stock: Number(cantidad) } }
          );
        } catch (rbErr) {
          console.error('Error al revertir manualmente el stock:', rbErr);
        }

        console.error('Error procesando venta sin transacción:', err);
        return res.status(500).json({ error: 'Error al procesar la venta' });
      }
    }
  } catch (error) {
    try {
      if (session && useTransactions) await session.abortTransaction();
    } catch (abortError) {
      console.error('Error al revertir la transacción:', abortError);
    }

    if (session) session.endSession();
    console.error('Error crítico en la transacción de venta:', error);

    return res.status(500).json({
      error: 'Error al procesar la venta. Transacción revertida automáticamente.'
    });
  }
};

module.exports = {
  realizarVenta
};