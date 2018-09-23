require('dotenv').config()
const twilio = require('twilio')
const VoiceResponse = require('twilio').twiml.VoiceResponse
const express = require('express')
const urlencoded = require('body-parser').urlencoded

const { 
  GURULAKAHVI_PHONENUMBER,
  GURULAKAHVI_ACCOUNTSID,
  GURULAKAHVI_AUTHTOKEN,
  GURULAKAHVI_BASEURL
} = process.env

const vituttaa = `jep katsokaas nyt kyllä vituttaa rupes vähä vituttaan tänä aamuna kävi vähä näin sunnuntaiaamuna kävi tälles tälle kahvinkeittimelle tuli tunnit täyteen varmaan kattokaas mitä tälle kävi tolle tälle näin tälle kävi tälläin näin jos se näkyy tähän kameraan kai se nyt näkyy jotenki halkes toi pohja perkele tosta halkes pohja tästä kahvinkeittimestä halkes pohja nyt kyllä vituttaa ku halkes pohja niin vituttaa kyllä meni kahvinkeitin paskaks pohja halkes tästä oikeen halkes joo pohja halkes oikeen kunnolla tosta napsahti vaan ja halkes pohja niin nyt rupes kyllä vituttaan oikeen rankasti että vituttaa hyvä kahvinkeitin meni siinä tommonen kahvinkeitin meni siinä meni siinä sitte nyt sitte rupes vituttaan ai ai löytysköhän roskiksesta uutta tämmöstä pannua vai mistä löytyis noh kyllä se vituttaa mutta onneksi mulla sattu oleen varakahvinkeitin tämmönen varakahvinkeitin ku BRINSEEES oikeen kunnon kahvinkeitin siinä on sitte varakeitin päästään keitteleen tällä sitte ravitsevat kahvit tällä keittimellä tämmösellä keittimellä keitetään sitte kahvit taas tänään sitte ravitsevat kahvit tulee tämmösellä keittimellä sitte onneks oli varalla tämmönen huh huh muuten ku tää hajos niin vituttaa kyllä silti vaikka on varakeitin niin kyllä vituttaa tää oli hyvä keitin tää oli pirun hyvä kahvinkeitin kyllä nyt kyllä vituttaa ankarasti juu-u ei mulla täällä muuta että tälläsiä tunnelmia täältä tänään oikeen vituttaa rankasti vituttaa hajos kahvinkeitin siinä se ny meni`

const app = express()

app.use(urlencoded({ extended: false }))

let coffeeStatus = {
  isCoffee: false,
  when: null
}

const baseUrl = GURULAKAHVI_BASEURL
const askForMilk = false

app.post('/voice', (request, response) => {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse();

  const { body: { Digits } } = request

  if (Digits && Digits === '0') {
    twiml.say({ voice: 'woman', language: 'fi-FI' }, vituttaa)
    twiml.redirect('/voice');
  }

  if (request.query.milk) {
    twiml.say('Thank you for your help.')
    console.log(Digits === '1' ? 'Yes we have milk' : 'No we do not have milk')
  } else if (Digits && ['1','2'].includes(Digits)) {
    twiml.say('Thank you for your help.')
    coffeeStatus = { isCoffee: Digits === '1', when: new Date() }
    console.log(coffeeStatus)
    if (askForMilk && Digits === '1') {
      const gather = twiml.gather({ numDigits: 1, action: baseUrl + '/voice?milk=true' })
      gather.say('Do we have milk? Press one, if yes. Otherwise press two.')
    }
  } else {
    const gather = twiml.gather({ numDigits: 1 });
    gather.pause({ length: 2 })
    gather.say('Coffee bot here. Press one, if the coffee machine has coffee. Otherwise, press two.');
    twiml.redirect('/voice');
  }

  response.type('text/xml');
  response.send(twiml.toString());
})

app.post('/status', (request, response) => {
  const { body: { CallStatus } } = request
  console.log('Call status: ' + CallStatus)
  response.json({})
})

const port = 5000

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)

  const client = new twilio(GURULAKAHVI_ACCOUNTSID, GURULAKAHVI_AUTHTOKEN)

  const gurulanumero = '+358504480186'

  client.calls
        .create({
          url: baseUrl + '/voice',
          to: gurulanumero,
          statusCallback: baseUrl + '/status',
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
          from: GURULAKAHVI_PHONENUMBER
        })
        .then(call => console.log(call.sid))
        .done();
})