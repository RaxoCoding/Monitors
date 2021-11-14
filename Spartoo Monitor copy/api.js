const express = require('express')
const app = express()
const port = process.env.PORT || 3000
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    console.log(req.query);
    res.render('atc', { productId: req.query.productId, size: req.query.size, rwId: req.query.rwId })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})