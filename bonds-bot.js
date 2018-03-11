const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')
const mongoose = require('mongoose');

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(Telegraf.log())
bot.use(session())


// Connection URL
const dbUrl = 'mongodb://test:test@ds125368.mlab.com:25368/gpipobot';

mongoose.connect(dbUrl);

var userSchema = mongoose.Schema({
  id: Number,
  name: String,
  phone: String,
  lastSeen: Date,
  disclaimerAccepted:Boolean
});

var User = mongoose.model('User', userSchema);

/*
function getUser (uId, callback) {
  console.log ('in getUser')
  var query = User.findOne({ 'id': uId });
  query.select('name disclaimerAccepted');

  query.exec(function (err, person) {
    if (err) return callback(err, null);
    callback (null, person)
  });
}
*/

function getUser (uId, callback) {
  console.log ('in getUser')
  var query = User.findOne({ 'id': uId });
  query.select('name disclaimerAccepted');
  return query.exec();
}


function handleError(err){
  console.error(err);
}

function mainMenuFull(ctx){
  return ctx.reply ('Бот для ГПИП', Markup
    .keyboard([['Акции', 'Облигации'], ['ПИФ', 'Валюта', 'Форекс']])
    .oneTime()
    .resize()
    .extra()
  )
}

function mainMenuDisclaimer(ctx){
  return ctx.reply ('Вы здесь впервые, либо до сих пор не ознакомились с важной информацией. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ: ', Markup
    .keyboard(['ПРИНЯТЬ ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ'])
    .oneTime()
    .resize()
    .extra()
  )
}



function mainMenu (ctx) {
  var user = ctx.session.user;
  if (user) { 
    if (user.disclaimerAccepted) return mainMenuFull(ctx);
    else return mainMenuDisclaimer(ctx);
  }
  else {//user not in session
    console.log('user null')
    getUser(ctx.message.from.id)
      .then(person => {
        ctx.session.user = person    
        if (person.disclaimerAccepted) 
          return mainMenuFull(ctx);
        else 
          return mainMenuDisclaimer(ctx);
      })
      .catch (error => {
        handleError(error);
      });
  }
}


function disclaimerGranted(ctx) {
  getUser(ctx.message.from.id)
    .then(person => {
      person.disclaimerAccepted = true;
      person.save();
      ctx.session.user = person;
      return mainMenu(ctx);
    })
    .catch (error => {
      handleError(error);
    });
}      


function stocksMenu (ctx) {
  ctx.reply('Выберите бумагу:', Extra.HTML().markup((m) =>
    m.inlineKeyboard([
      [m.callbackButton('Алроса', 'STOCK:ALRS'), m.callbackButton('Распадская', 'STOCK:RASP')],
      [m.callbackButton('Другой инструмент', 'STOCK:NEW')]
    ])))
  return  ctx.reply('...или действие', Markup
    .keyboard(['Назад', 'Главное меню'])
    .oneTime()
    .resize()
    .extra()
  )
}



bot.command(['start', 'START', 'Start'], (ctx) => mainMenu(ctx))
bot.hears('Главное меню', (ctx) => mainMenu(ctx))
bot.hears('ПРИНЯТЬ ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ', (ctx) => disclaimerGranted(ctx))
bot.hears('Назад', (ctx) => {
  if (ctx.session.prevScreen)
    return ctx.session.prevScreen(ctx)
 
})

bot.hears('Акции', (ctx) => {
  ctx.session.prevScreen = mainMenu
  return stocksMenu(ctx)
})


bot.action(/STOCK:(.+)/, (ctx) => {
  ctx.answerCbQuery()
  return ctx.reply(ctx.match[1])
})


bot.command('sss', (ctx) => {
  return ctx.reply('Keyboard wrap', Extra.markup(
    Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
      wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
    })
  ))
})


bot.command('onetime', ({ reply }) =>
  reply('One time keyboard', Markup
    .keyboard(['/simple', '/inline', '/pyramid'])
    .oneTime()
    .resize()
    .extra()
  )
)

bot.command('custom', ({ reply }) => {
  return reply('Custom buttons keyboard', Markup
    .keyboard([
      ['🔍 Search', '😎 Popular'], // Row1 with 2 buttons
      ['☸ Setting', '📞 Feedback'], // Row2 with 2 buttons
      ['📢 Ads', '⭐️ Rate us', '👥 Share'] // Row3 with 3 buttons
    ])
    .oneTime()
    .resize()
    .extra()
  )
})

bot.hears('🔍 Search', ctx => ctx.reply('Yay!'))
bot.hears('📢 Ads', ctx => ctx.reply('Free hugs. Call now!'))

bot.command('special', (ctx) => {
  return ctx.reply('Special buttons keyboard', Extra.markup((markup) => {
    return markup.resize()
      .keyboard([
        markup.contactRequestButton('Send contact'),
        markup.locationRequestButton('Send location')
      ])
  }))
})

bot.command('pyramid', (ctx) => {
  return ctx.reply('Keyboard wrap', Extra.markup(
    Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
      wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
    })
  ))
})

bot.command('simple', (ctx) => {
  return ctx.replyWithHTML('<b>Coke</b> or <i>Pepsi?</i>', Extra.markup(
    Markup.keyboard(['Coke', 'Pepsi'])
  ))
})

bot.command('inline', (ctx) => {
  return ctx.reply('<b>Coke</b> or <i>Pepsi?</i>', Extra.HTML().markup((m) =>
    m.inlineKeyboard([
      m.callbackButton('Coke', 'Coke'),
      m.callbackButton('Pepsi', 'Pepsi')
    ])))
})

bot.command('random', (ctx) => {
  return ctx.reply('random example',
    Markup.inlineKeyboard([
      Markup.callbackButton('Coke', 'Coke'),
      Markup.callbackButton('Dr Pepper', 'Dr Pepper', Math.random() > 0.5),
      Markup.callbackButton('Pepsi', 'Pepsi')
    ]).extra()
  )
})

bot.hears(/\/wrap (\d+)/, (ctx) => {
  return ctx.reply('Keyboard wrap', Extra.markup(
    Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
      columns: parseInt(ctx.match[1])
    })
  ))
})

bot.action('Dr Pepper', (ctx, next) => {
  return ctx.reply('👍').then(() => next())
})

bot.action(/.+/, (ctx) => {
  return ctx.answerCbQuery(`Oh, ${ctx.match[1]}! Great choice`)
})

bot.startPolling()
