import express from 'express';

import ClassesController from './controllers/ClassesController';
import ConnectionsController from './controllers/ConnectionsController';

const routes = express.Router();
const classesControllers = new ClassesController();
const connectionsController = new ConnectionsController();

// Rota GET > Buscando informações
routes.get('/classes', classesControllers.index);

// Rota POST > Criando aula
routes.post('/classes', classesControllers.create);

// Rota POST > Criando conexão
routes.get('/connections', connectionsController.index);
routes.post('/connections', connectionsController.create);

export default routes;