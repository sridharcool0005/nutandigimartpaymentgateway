
let express = require('express'),
router = express.Router();

const paymentController= require('../controllers/paymentController');

router.post('/paywithpaytm',paymentController.paywithpaytm);
router.post('/paywithpaytmresponse',paymentController.paywithpaytmresponse);
router.get('/getorderconfirm',paymentController.getOrderConfirm);
router.post('/getorderDetails',paymentController.getorderDetails);




module.exports = router;