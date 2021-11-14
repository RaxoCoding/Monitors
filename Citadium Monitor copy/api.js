const express = require('express')
const app = express()
const port = process.env.PORT || 3000
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    console.log(req.query);
    res.render('atc', { action: 'addRef', refId: req.query.refId, saleId: req.query.saleId, do: 'majPanier', qty: '1', isCadeau: '0', origine: 'ajout_fiche_produit' })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})