const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger-output.json');

const options = {
    swaggerOptions: {
        requestInterceptor: function (request) {
            const target = new URL(request.url, window.location.href);
            const method = (request.method || 'GET').toUpperCase();

            if (
                target.origin === window.location.origin &&
                ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
            ) {
                request.headers = request.headers || {};
                request.headers['X-Requested-With'] = 'XMLHttpRequest';
            }

            return request;
        }
    }
};

router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, options)
);

module.exports = router;