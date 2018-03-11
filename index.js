const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')

const pif = require('./pif');

const bot = new Telegraf(process.env.BOT_TOKEN);


var handle = {}
handle["Главное меню"] = mainMenu;
handle["Назад"] = goBack;
handle["Акции"] = stocksMenu;
handle["ПИФ"] = pifMenu;


bot.use(Telegraf.log())
bot.use(session())


bot.command(['start', 'START', 'Start'], (ctx) => mainMenu(ctx));


bot.command('test', (ctx) => {
  ctx.replyWithMarkdown('*Дополнительная информация по ссылке* [inline URL](http://www.example.com/)')
//  return ctx.replyWithDocument({ source: 'uploads/Rus42.jpg' }).then(msg => {
//    console.log('doc sent');
//    console.log(msg);
//  })
  return ctx.replyWithDocument('BQADAgADmgEAAujUqEig05PIRKGihAI').then(msg => {
    console.log('doc sent');
    console.log(msg);
  })
})

bot.hears(/.+/, (ctx) => {
  if (typeof handle[ctx.message.text] === 'function') {
    handle[ctx.message.text](ctx);
  } else {
    console.log("No request handler found for " + ctx.message.text);
  }
})


function mainMenu (ctx) {
  return ctx.reply ('Бот для ГПИП', Markup
    .keyboard([['Акции', 'Облигации'], ['ПИФ', 'Валюта', 'Форекс']])
//    .oneTime()
    .resize()
    .extra()
  )
}

function stocksMenu (ctx) {
  ctx.session.prevScreen = mainMenu
  return ctx.reply('Выберите бумагу:', Extra.HTML().markup((m) =>
    m.inlineKeyboard([
      [m.callbackButton('Алроса', 'STOCK:ALRS'), m.callbackButton('Распадская', 'STOCK:RASP')],
      [m.callbackButton('Другой инструмент', 'STOCK:NEW')]
    ])));
//  return mainMenu(ctx);
  
/*
  return  ctx.reply('...или действие', Markup
    .keyboard(['Назад', 'Главное меню'])
    .oneTime()
    .resize()
    .extra()
  )
*/
}

function goBack (ctx) {
  if (ctx.session.prevScreen)
    return ctx.session.prevScreen(ctx);
  else return mainMenu(ctx);
}  


var pifInlineKeyb = getPifInlineKeyb();


function getPifInlineKeyb() {
  var keyb = [];
  
  pif.pifContainer.funds.forEach(function(pifInfo, index) {
    keyb.push(Markup.callbackButton(pifInfo.name, "ПИФ:" + index));
  }); 
  return Markup.inlineKeyboard(keyb, {
      wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
    }).extra();
  //buildkeyboard
}


function pifMenu (ctx) {
  return ctx.reply(pif.pifContainer.shortInfo,  pifInlineKeyb);
}




bot.action(/STOCK:(.+)/, (ctx) => {
  //ctx.answerCbQuery()
  return ctx.editMessageReplyMarkup(
    { inline_keyboard:[
        [{text:'АЛРОСА-2', callback_data:'ALRS-2'}, {text:'Распадская-2', callback_data:'RASP-2'}],
        [{text:'другой инструмент', callback_data:'new'}]
      ] 
      
    }
  )
  //return ctx.reply(ctx.match[1])
})

bot.action(/ПИФ:(.+)/, (ctx) => {
  var pifSelected = pif.pifContainer.funds[ctx.match[1]];
  ctx.answerCbQuery();
//  ctx.replyWithMarkdown('*' + pifSelected.name + '*'); //выделение жирным
  ctx.replyWithPhoto({ source: 'uploads/' + pifSelected.splashImage })
    .then(()=>{
      // todo обработка ошибки отправки
      ctx.reply(pifSelected.shortInfo)
        .then(()=> {
          ctx.replyWithMarkdown('[Инвестиционная стратегия](' + pifSelected.link + ')');
        });
    });
  return;
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
