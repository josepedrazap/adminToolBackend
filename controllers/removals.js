const Removals = require('../models/removals')
const Locals = require('../models/locals')
const Transporters = require('../models/transporters')
const pdfUpload = require('../services/pdfUpload')
const Customers = require('../models/costumers')

exports.retriveRemovals = async (req, res) => {
  var search = JSON.parse(req.query.searchData)

  if (search.type === 'LOCAL') {
    const locals = await Locals.find({ name: { $regex: '.*' + search.search.toLowerCase() + '.*' } })
    search.search = {
      localID: { $in: locals.map(local => local._id) }
    }
  }
  if (search.type === 'TRANSPORTER') {
    const trans = await Transporters.find(
      { $or: [
        { name: { $regex: search.search.toLowerCase(), $options: 'i' } },
        { lastName: { $regex: search.search.toLowerCase(), $options: 'i' }
        }]
      })
    search.search = {
      transporterID: { $in: trans.map(tran => tran._id) }
    }
  }

  Removals.find({ status: { $ne: 'DELETED' }})
    .populate('localID')
    .populate('transporterID')
    .populate('lastModificationID')
    .exec((err, removals) => {
      if (err) {
        console.log(err)
        return res.status(400).send()
      }
      Locals.populate(removals, {path: "localID.customerID", model: "Costumer"}, (_err, removals) => {
        return res.status(200).send(removals)
      })
    })
}

exports.getDataCreateRemoval = async (req, res) => {
  const customers = await Customers.find({ status: "READY" }).populate('localsID')
  console.log(customers)
  const locals = []
  await customers.forEach(customer => {
    customer.localsID.forEach(element => {
      locals.push({...element, name: customer.brand + " - " + element.name})
    })
  })
  const trasportists = await Transporters.find()
  return res.status(200).send({ locals, trasportists })
}

exports.createRemoval = async (req, res) => {
  console.log(req.body)
  let status = 'PENDING_TRANS'
  var removal = null

  if (req.body.transporterID) {
    if (String(req.body.payment) === '0') {
      status = 'PENDING_PAYMENT'
    } else {
      status = 'COMPLETE'
    }
  }

  if (req.body._id) {
    removal = await Removals.findOneAndUpdate(
      { _id: req.body._id },
      { ...req.body,
        status,
        lastModificationID: req.userID,
        datetimeLastModification: Date.now() })

    if (req.body.file) {
      pdfUpload.index({
        pdf: req.body.file,
        name: removal._id
      }).then(async response => {
        await Removals.findOneAndUpdate({ _id: removal._id }, { urlReport: response })
        return res.status(200).send(removal)
      }).catch(err => {
        return res.status(412).send(err)
      })
    } else {
      return res.status(200).send(removal)
    }
  } else {
    delete req.body._id
    removal = await Removals.create({ ...req.body, status })
    console.log(removal)
    if (req.body.file) {
      pdfUpload.index({
        pdf: req.body.file,
        name: removal._id
      }).then(async response => {
        await Removals.findOneAndUpdate({ _id: removal._id }, { urlReport: response })
        return res.status(200).send(removal)
      }).catch(err => {
        return res.status(400).send(err)
      })
    } else {
      return res.status(200).send(removal)
    }
  }
}

exports.deleteRemoval = async (req, res) => {
  const removal = await Removals.findOneAndUpdate({ _id: req.query.removalID }, { status: 'DELETED' })
  return res.status(200).send(removal)
}

exports.statsRemovals = async (req, res) => {
  var dateInit = new Date(req.query.dateInit.replace(/['"]+/g, ''))
  var dateFinish = new Date(req.query.dateFinish.replace(/['"]+/g, ''))

  const removalsPerLocal = await Removals.aggregate([
    { $match: { status: 'COMPLETE', datetimeRemoval: { $lt: dateFinish, $gt: dateInit } } },
    {
      $lookup: {
        from: 'locals',
        localField: 'localID',
        foreignField: '_id',
        as: 'local'
      }
    },
    { $unwind: '$local' },
    {
      $project: {
        name: '$local.name',
        payment: '$payment',
        suscription: '$local.suscription'
      }
    },
    { $group: { _id: { name: '$name', suscription: '$suscription' }, total: { $sum: '$payment' }, quantity: { $sum: 1 } } }
  ])
  console.log(removalsPerLocal)
  const totalMaterials = await Removals.aggregate([
    { $match: { status: 'COMPLETE', datetimeRemoval: { $lt: dateFinish, $gt: dateInit } } },
    { $project: { _id: 0, materials: 1 } },
    { $unwind: '$materials' },
    { $group: { _id: '$materials.material', quantity: { $sum: '$materials.quantity' } } },
    { $sort: { quantity: -1 } }
  ])

  const removalsRate = await Removals.aggregate([
    { $match: { status: 'COMPLETE', datetimeRemoval: { $lt: dateFinish, $gt: dateInit } } },
    {
      $group: {
        _id: { $dayOfMonth: '$datetimeRemoval' },
        total: {
          $sum: '$payment'
        },
        cont: {
          $sum: 1
        }
      }
    }
  ])
  var removalsRates = []
  for (let i = 0; i < 31; i++) {
    removalsRates[i] = { cont: 0, total: 0, date: i + 1 }
    removalsRate.forEach(element => {
      if (parseInt(element._id) === i) {
        removalsRates[i] = { cont: element.cont, total: element.total, date: i + 1 }
      }
    })
  }
  return res.status(200).send({ removalsPerLocal, removalsRates, totalMaterials })
}
