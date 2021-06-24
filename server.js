const express = require('express');

const app = express();
const cors = require('cors')
const bodyParser = require('body-parser')

const mongoose = require('mongoose')
const { Schema } = mongoose;

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const tipSchema = new Schema({
  type: {
    type: String,
    enum : ['question','tip'], 
    default: 'tip'
  },
  description: {
    type: String,
    required: true
  },
  answer: {
    type: String
  },
  status: {
    type: Number,
    enum: [0,1],
    default: 1
  },
  createdAt: {
    type: Date,
    required: true
  },
  modifiedAt: {
    type: Date
  }
})

const Tips = mongoose.model('tips', tipSchema)

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use("/public", express.static('public'))

// Home page (Front page)
app.get('/', (req, res) => {
  res.sendFile(__dirname +'/public/views/index.html')
});

// Add/Create a new GK row
app.post('/api/addGeneralKnowledge', (req, res) => {
  const params = req.body
  console.log(req.body)

  const insertion = new Tips({
    type: params.type,
    description: params.question.toString('utf8'),
    answer: (params.type == 'question')?params.answer:null,
    status: params.status ? params.status : 1,
    createdAt: new Date(),
    modifiedAt: null
  })

  insertion.save(function(err, insertedData) {    
    if(err) {
      console.log(err);
      return res.json({ status: "error", error: err })
    }

    res.json({ status: "success", data: insertedData })
  })
})

// List all GK row
app.get('/api/listGK', async (req, res) => {
  const params = req.query
  console.log(params)
  
  let cond = {};
  let orderCond = {};
  let orderStrategy = 1; // 1 = Asc, -1 Desc
  let pageCount = 10, pageNumber = 0;

  if(params.page !== undefined && params.page !== null && params.page !== '') {
    pageNumber = params.page;
  }

  if(Object.keys(params).length != 0) {
    let dated = {};
    if(params.from !== undefined && params.from !== null && params.from !== '') {
      dated = {
        ...dated,
        $gte: new Date(params.from),
      };      
    }

    if(params.to !== undefined && params.to !== null && params.to !== '') {
      dated = {
        ...dated,
        $lte: new Date(params.to)
      };      
    }

    if(params.type !== undefined && params.type !== null && params.type !== '') {
      cond = {
        ...cond,
        type: params.type
      }
    }

    if(params.search !== undefined && params.search !== null && params.search !== '') {
      let utfString = params.search.toString('utf8');
      cond = {
        ...cond,
        $or: [
          {
            description: {
              $regex: '.*' + utfString + '.*'
            }
          },
          {
            answer: {
              $regex: '.*' + utfString + '.*'
            }
          }
        ]
      }
    }

    if(Object.keys(dated).length > 0) {
      cond = {
          ...cond,
          createdAt: dated
      }
    }

    if(params.orderType !== undefined && params.orderType !== null) {
      if(params.orderType == 'asc') {
        orderStrategy = 1
      }

      if(params.orderType == 'desc') {
        orderStrategy = -1
      }
    }

    if(params.orderBy !== undefined && params.orderBy !== null) {
      switch(params.orderBy) {
        case 'type':
          orderCond = {
            sort: {
              type: orderStrategy
            }
          }

          break;
        case 'description':
          orderCond = {
            sort: {
              description: orderStrategy
            }
          };

          break;
        case 'answer':
          orderCond = {
            sort: {
              answer: orderStrategy
            }
          };

          break;
        case 'createdAt':
          orderCond = {
            sort: {
              createdAt: orderStrategy
            }
          };

          break;
        default:
          orderCond = {
            sort: {
              _id: orderStrategy
            }
          };

          break;
      }
      
    }
  }

  const totalCount = await Tips.find(cond, null, orderCond).countDocuments().exec();
  const totalPages = Math.ceil(totalCount / pageCount);

  Tips.find(cond, null, orderCond)
      .skip(pageNumber > 0 ? ((pageNumber - 1) * pageCount) : 0)
      .limit(pageCount)
      .exec(function(err, data) {
          if(err) {
            console.log(err);
            return res.json({ status: "error", error: err })
          }

          return res.json({ 
            status: "success", 
            filter: cond, 
            ...orderCond,
            count: totalCount,
            totalPages: totalPages,
            rowsPerPage: pageCount,
            currentPage: pageNumber,
            data 
          })
      })
})

// Server instance
const server = app.listen(3000, () => {
  console.log('Your application is running on ' + server.address().port);
});