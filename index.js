'use strict';

var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var async2 = require('async');
var XLSX = require('xlsx');
var sql = require("mssql");
var bodyParser = require('body-parser');
var express = require('express');
var Config = require('./const.js');
var FB = require('./facebook.js');
var request = require('request');
var loopback = require('loopback');
const uuidv1 = require('uuid/v1');
var soap = require('soap');


const pool = new sql.ConnectionPool({	
  user: 'xira_bot',
  password: 'x1r4B0t.$',
  server: '10.200.20.116',
  database: 'PentaRh_Xira' 
});

pool.connect(err => {
  if(err == null || err === 0)
  return;

  console.log('Error en la conexion del pool de SQL');
  console.log(err);
});

var doc = new GoogleSpreadsheet(Config.GOOGLE_SHEET_ID);
var sheet;
var xl;
var vacantes;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var connectedUserData = {};
 
let unknownIntentCount = 1; //checar
const PORT = process.env.PORT || 8447;
var sessions = {};

const app = express();
app.set('port', PORT);
app.listen(app.get('port'));
app.use(bodyParser.json());
console.log("I'm wating for you @" + PORT);

function findOrCreateSession(fbid)
{
  let sessionId;

  Object.keys(sessions).forEach(session => {
    if (sessions[session].fbid === fbid)
      sessionId = session;    
  });

  if (!sessionId) 
  {    
    sessionId = uuidv1();
    sessions[sessionId] = {
      fbid: fbid
    };
  } 

  return sessionId;
}

function bvacantes(xl)
{
  var count=0;
  var ser=[];
  for (var i = 0; i < xl.length; i++) {
    ser[i] = xl[i]['servicio'] + ' ' + xl[i]['turno'] + ' con los siguientes horarios ' + xl[i]['horarios'];

  }
  return ser;
}

function vacantesWS(vacantesWS)
{
  var vacantesList = [];
  var url = 'http://appext.pentafon.com/RhService/Service1.svc?wsdl';
  var args = {};
    
  soap.createClient(url, function(err, client) 
  {
    if(err != "null")
    {
      client.GetVacantes(args, function(err, result) 
      {  
          if(err != "null")
          {
            // if(result.GetVacantesResult)
              var response = result.GetVacantesResult.tbl_Vacantes;
              
              try
              {
                  function agrega(item, counter, array)
                  {
                    if(item.Estatus == "true")
                    {
                      var vacante = {nombre: "", horario: ""};
                      var dias = "L-V";
                      var horarios = "";

                      if(item.Sabado == "true")
                        dias = "L-S";

                      let horaIni = item.HoraIniSemana.substring(2);
                      let horaFin = item.HoraFinSemana.substring(2);

                      horarios = horaIni + "-" + horaFin;
                      
                      vacante.nombre = item.Vacante;
                      vacante.horario = dias + " " + horarios;

                      vacantesList.push(vacante);
                    }
                  }

                  response.forEach(agrega);                  
              }
              catch(err)
              {
                  console.log("Error al obtener la informacion: " + err)
              }
          }            
      });
    }
    else
        console.log("No se pudo crear el cliente para GetNivelEstudios: " + err);
  });

  vacantesWS(vacantesList);
}

function bsalario(xl,ss,tt)
{
  var count=0;
  for (var i = 0; i < xl.length; i++) {
    if(xl[i]['servicio'] == ss && xl[i]['turno'] == tt)
    {
      var sueldo =  ' el salario es de : ' + xl[i]['salario'] + ', con un bono de productividad de : ' + xl[i]['bonoproductividad'] + ' y un apoyo para transporte de : ' + xl[i]['apoyodetransporte']; 
    }
  }
  return sueldo;
}

const nodemailer = require('nodemailer');
function corre(mim)
{
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pentafoncontratacion@gmail.com',
        pass: '1234567890PC'
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: 'pentafoncontratacion@gmail.com', // sender address
    to: 'bherrera@neikos.com.mx', // list of receivers
    subject: 'RHP', // Subject line
    text: '', // plain text body
    html: '<b>RHP ' + mim + '</b>' // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    // console.log('Message %s sent: %s', info.messageId, info.response);
  });
}

function atiende(mim)
{
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pentafoncontratacion@gmail.com',
        pass: '1234567890PC'
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: 'pentafoncontratacion@gmail.com', // sender address
    to: 'bherrera@neikos.com.mx, vlopez@pentafon.com, jvelasco@pentafon.com, jsanchez@pentafon.com', // list of receivers
    subject: 'Checa : ' + mim, // Subject line
    text: '', // plain text body
    html: '<b>RHP  Checa: ' + mim + '</b>' // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    // console.log('Message %s sent: %s', info.messageId, info.response);
  });
}

function referido(cor,con)
{
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pentafoncontratacion@gmail.com',
      pass: '1234567890PC'
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: 'pentafoncontratacion@gmail.com', // sender address
      to: cor, // list of receivers
      subject: 'Conoce más de Pentafon', // Subject line
      text: '', // plain text body
      html: '<b>En Pentafon estamos muy interesados en tu talento, te recomendó ' + con + '.<br><br> ¿Gustas conocer nuestras vacantes? contáctanos haciendo click aquí: </b> <br><br>https://www.facebook.com/talentospentafon/ ' // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      // console.log('Message %s sent: %s', info.messageId, info.response);
  });
}

function corvac(con)
{
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'pentafoncontratacion@gmail.com',
          pass: '1234567890PC'
      }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: 'pentafoncontratacion@gmail.com', // sender address
      to: 'sfajer@neikos.com.mx', // list of receivers
      subject: 'Vacantes RH', // Subject line
      text: '', // plain text body
      html: '<b>' + con + ' solicitó vacantes</b>' // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error)
        return console.log(error);
      // console.log('Message %s sent: %s', info.messageId, info.response);
  });
}

function coper(nom, cor, cita)
{
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pentafoncontratacion@gmail.com',
        pass: '1234567890PC'
    }
  });

  var mim='Te confirmamos tu entrevista ' + nom + ', en el siguiente horario: ' + cita + ' <br><br> Para Pentafon, la gente feliz es la clave del éxito. <br><br> Somos un centro de contacto con más de 11 años de experiencia y más de 2,000 colaboradores con presencia en la Ciudad de México, Morelia, y Venezuela. <br><br>';

  // setup email data with unicode symbols
  let mailOptions = {
    from: 'pentafoncontratacion@gmail.com', // sender address
    to: cor, // list of receivers
    subject: 'Seguimiento de Cita', // Subject line
    text: '', // plain text body
    html:  mim , // html body
    attachments: [
        {   // utf-8 string as an attachment
            path: './img1.png'
        }]

  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    // console.log('Message %s sent: %s', info.messageId, info.response);
  });
}

function rep1(usinfo)
{
    var workbook = XLSX.readFile('./reporte1.xlsx');
    var first_sheet_name = workbook.SheetNames[0];
    var worksheet = workbook.Sheets[first_sheet_name];
    
    //console.log(worksheet)
    //console.log(CP)
    worksheet['!ref'] = 'A1:J52';

    for(var i = 2; i < 50; i++)
    {
        var address_of_cella = 'A'+ i;    
        var desired_cella = worksheet[address_of_cella];
        var desired_valuea = (desired_cella ? desired_cella.v : undefined);
        
        if(desired_valuea==undefined)
        {

            worksheet['A' + i] = { t: 's', v: usinfo['usuario'], r: '<t>' + usinfo['usuario'] + '</t>', h: usinfo['usuario'], w: usinfo['usuario'] };    
            worksheet['B' + i] = { t: 's', v: usinfo['fullname'], r: '<t>' + usinfo['fullname'] + '</t>', h: usinfo['fullname'], w: usinfo['fullname'] };    
            worksheet['C' + i] = { t: 's', v: usinfo['cita'], r: '<t>' + usinfo['cita'] + '</t>', h: usinfo['cita'], w: usinfo['cita'] };    
            worksheet['D' + i] = { t: 's', v: usinfo['tel'], r: '<t>' + usinfo['tel'] + '</t>', h: usinfo['tel'], w: usinfo['tel'] };    
            worksheet['E' + i] = { t: 's', v: usinfo['email'], r: '<t>' + usinfo['email'] + '</t>', h: usinfo['email'], w: usinfo['email'] };    
            worksheet['F' + i] = { t: 's', v: usinfo['exp'], r: '<t>' + usinfo['exp'] + '</t>', h: usinfo['exp'], w: usinfo['exp'] };    
            worksheet['G' + i] = { t: 's', v: usinfo['edad'], r: '<t>' + usinfo['edad'] + '</t>', h: usinfo['edad'], w: usinfo['edad'] };    
            worksheet['H' + i] = { t: 's', v: usinfo['bach'], r: '<t>' + usinfo['bach'] + '</t>', h: usinfo['bach'], w: usinfo['bach'] };    
            worksheet['I' + i] = { t: 's', v: usinfo['otroproc'], r: '<t>' + usinfo['otroproc'] + '</t>', h: usinfo['otroproc'], w: usinfo['otroproc'] };    
            worksheet['J' + i] = { t: 's', v: usinfo['numproc'], r: '<t>' + usinfo['numproc'] + '</t>', h: usinfo['numproc'], w: usinfo['numproc'] };    
            workbook.Sheets['Hoja1'] = worksheet;
            i=50;
            // console.log(workbook.Sheets['Hoja1'])
            XLSX.writeFile(workbook, './reporte1.xlsx') 
        }
    }
}

function rep2(usinfo)
{
  var mañana = formatDatem(new Date());
  var mañananum = mañana.match(/\d+/)[0];
  mañananum = Number(mañananum);
  var mañanamon = mañana.replace(/[0-9]/g, '');
  var mañanamonth = mañanamon.replace(/\s/g, "");
  var pasado = formatDatepp(mañananum,mañanamonth);
  var workbook = XLSX.readFile('./reporte1.xlsx');
  var first_sheet_name = workbook.SheetNames[1];
  var worksheet = workbook.Sheets[first_sheet_name];
    
    //console.log(worksheet)
    //console.log(CP)
    worksheet['!ref'] = 'A1:I52';
    var c1 = mañana + ' 10:00 am';
    var c2 = mañana + ' 4:00 pm';
    var c3 = pasado + ' 10:00 am';
    // console.log(c1)
    // console.log(c2)
    // console.log(c3)
    // console.log(usinfo['cita'])
    if(usinfo['cita']==c1)
    {
        var address_of_cell = 'B' + 2;    
        var desired_cell = worksheet[address_of_cell];
        var desired_value = (desired_cell ? desired_cell.v : undefined);

        if(desired_value==undefined)
            desired_value = '0';

        var newval =  parseInt(desired_value) + 1;
        worksheet['B' + 2] = { t: 's', v: newval, r: '<t>' + newval + '</t>', h: newval, w: newval };  
        var address_of_celln = 'C'+ 2;    
        var desired_celln = worksheet[address_of_celln];
        var desired_valuen = (desired_celln ? desired_celln.v : undefined);   

        if(desired_valuen==undefined)
          var newvaln =  usinfo['fullname'];
        else
          var newvaln =  desired_valuen + ', ' + usinfo['fullname'];
        
        worksheet['C' + 2] = { t: 's', v: newvaln, r: '<t>' + newvaln + '</t>', h: newvaln, w: newvaln };  
    }
    else if(usinfo['cita']==c2)
    {

        var address_of_cell = 'B' + 3;    
        var desired_cell = worksheet[address_of_cell];
        var desired_value = (desired_cell ? desired_cell.v : undefined);

        if(desired_value==undefined)
            desired_value = '0';

        var newval =  parseInt(desired_value) + 1;
        worksheet['B' + 3] = { t: 's', v: newval, r: '<t>' + newval + '</t>', h: newval, w: newval }; 
        var address_of_celln = 'C'+ 3;    
        var desired_celln = worksheet[address_of_celln];
        var desired_valuen = (desired_celln ? desired_celln.v : undefined); 

        if(desired_valuen==undefined)
            var newvaln =  usinfo['fullname'];
        else
            var newvaln =  desired_valuen + ', ' + usinfo['fullname'];
        worksheet['C' + 3] = { t: 's', v: newvaln, r: '<t>' + newvaln + '</t>', h: newvaln, w: newvaln };      
    }
    else if(usinfo['cita']==c3)
    {
        var address_of_cell = 'B' + 4;    
        var desired_cell = worksheet[address_of_cell];
        var desired_value = (desired_cell ? desired_cell.v : undefined);

        if(desired_value==undefined)
            desired_value = '0';

        var newval =  parseInt(desired_value) + 1;
        worksheet['B' + 4] = { t: 's', v: newval, r: '<t>' + newval + '</t>', h: newval, w: newval };  
        var address_of_celln = 'C'+ 4;    
        var desired_celln = worksheet[address_of_celln];
        var desired_valuen = (desired_celln ? desired_celln.v : undefined);   

        if(desired_valuen==undefined)
            var newvaln =  usinfo['fullname'];
        else
            var newvaln =  desired_valuen + ', ' + usinfo['fullname'];
        worksheet['C' + 4] = { t: 's', v: newvaln, r: '<t>' + newvaln + '</t>', h: newvaln, w: newvaln };     
    }

    var address_of_cella = 'A' + 2;    
        var desired_cella = worksheet[address_of_cella];
        var desired_valuea = (desired_cella ? desired_cella.v : undefined);

        if(desired_valuea==undefined)
        {
         worksheet['A' + 2] = { t: 's', v: c1, r: '<t>' + c1 + '</t>', h: c1, w: c1 };
         worksheet['A' + 3] = { t: 's', v: c2, r: '<t>' + c2 + '</t>', h: c2, w: c2 };   
         worksheet['A' + 4] = { t: 's', v: c3, r: '<t>' + c3 + '</t>', h: c3, w: c3 };
        }

    // console.log(workbook.Sheets['Hoja2'])
    XLSX.writeFile(workbook, './reporte1.xlsx') 
}

function cap(usinfo)
{
  console.log(usinfo)
      var mañana = formatDatem(new Date());
  var mañananum = mañana.match(/\d+/)[0];
    mañananum = Number(mañananum);
  var mañanamon = mañana.replace(/[0-9]/g, '');
  var mañanamonth = mañanamon.replace(/\s/g, "");
  var pasado = formatDatepp(mañananum,mañanamonth);
    var workbook = XLSX.readFile('./cap.xlsx');
    var first_sheet_name = workbook.SheetNames[0];
    var worksheet = workbook.Sheets[first_sheet_name];
    var c1 = mañana + ' 10:00 am';
    var c2 = mañana + ' 4:00 pm';
    var c3 = pasado + ' 10:00 am';
    console.log(c1)
    console.log(c2)
    console.log(c3)
    console.log(worksheet)

    for (var i = 0; i < 50; i++) {
        var address_of_cell = 'A' + (i+1); 
        //console.log(address_of_cell)   
        var desired_cell = worksheet[address_of_cell];
        var desired_value = (desired_cell ? desired_cell.v : undefined);
        //console.log(desired_value)
        
        if(desired_value==undefined)
        {   var k = i+1;
            i = 100;
        }
        console.log(k)
        //worksheet['A' + k] = { t: 's', v: newval, r: '<t>' + newval + '</t>', h: newval, w: newval };    
        
    }
    if(usinfo['cita']==c1)
    {
        
        var cell = {t:'s', v:mañana};

        worksheet['A' + k] = cell;  

        var newvaln = '10:00 am';
        worksheet['B' + k] = { t: 's', v: newvaln, r: newvaln, h: newvaln, w: newvaln };  

        var newvaln =  usinfo['fullname'];
        worksheet['C' + k] = { t: 's', v: newvaln, r: newvaln, h: newvaln, w: newvaln };  

        var newvaln =  usinfo['email'];
        worksheet['D' + k] = { t: 's', v: newvaln, r: newvaln, h: newvaln, w: newvaln };  
    }
    else if(usinfo['cita']==c2)
    {
        var cell = {t:'s', v:mañana};

        worksheet['A' + k] = cell;  

        var newvaln = '4:00 pm';
        worksheet['B' + k] = { t: 's', v: newvaln, r:  newvaln, h: newvaln, w: newvaln };  

        var newvaln =  usinfo['fullname'];
        worksheet['C' + k] = { t: 's', v: newvaln, r:  newvaln, h: newvaln, w: newvaln };

        var newvaln =  usinfo['email'];
        worksheet['D' + k] = { t: 's', v: newvaln, r: newvaln, h: newvaln, w: newvaln };    
    }
    else if(usinfo['cita']==c3)
    {
        var cell = {t:'s', v:pasado};

        worksheet['A' + k] = cell;  

        var newvaln = '10:00 am';
        worksheet['B' + k] = { t: 's', v: newvaln, r:  newvaln , h: newvaln, w: newvaln };  

        var newvaln =  usinfo['fullname'];
        worksheet['C' + k] = { t: 's', v: newvaln, r:  newvaln , h: newvaln, w: newvaln }; 

        var newvaln =  usinfo['email'];
        worksheet['D' + k] = { t: 's', v: newvaln, r: newvaln, h: newvaln, w: newvaln };   
    }

    var range = XLSX.utils.decode_range(worksheet['!ref']);
    var addr = XLSX.utils.decode_cell('D' + k);
    if(range.s.c > addr.c) range.s.c = addr.c;
    if(range.s.r > addr.r) range.s.r = addr.r;
    if(range.e.c < addr.c) range.e.c = addr.c;
    if(range.e.r < addr.r) range.e.r = addr.r;
    worksheet['!ref'] = XLSX.utils.encode_range(range);

    //console.log(worksheet)
    workbook.Sheets[first_sheet_name] = worksheet;
    console.log(workbook.Sheets[first_sheet_name])
    XLSX.writeFile(workbook, './cap.xlsx') 
}

function rep3()
{
    var workbook = XLSX.readFile('./reporte1.xlsx');
    var first_sheet_name = workbook.SheetNames[2];
    var worksheet = workbook.Sheets[first_sheet_name];
    worksheet['!ref'] = 'A1:I52';
    var address_of_cella = 'A'+ 2;    
    var desired_cella = worksheet[address_of_cella];
    var desired_valuea = (desired_cella ? desired_cella.v : undefined);
    // console.log(desired_valuea)
    var newval =  parseInt(desired_valuea) + 1;
    // console.log(newval)
    
    worksheet['A' + 2] = { t: 's', v: newval, r: '<t>' + newval + '</t>', h: newval, w: newval };            
    workbook.Sheets['Hoja3'] = worksheet;
    XLSX.writeFile(workbook, './reporte1.xlsx') 
}

function formatDatem(date) 
{
  var domingo = false;
  var sabado = false;
    var monthNames = [
      "Enero", "Feb", "Mar",
      "Abril", "Mayo", "Junio", "Julio",
      "Ago", "Sept", "Oct",
      "Nov", "Dic"
    ];

  var monthIndex = date.getMonth();

  if (date.getDate()<30)
  {
    if (monthNames[monthIndex] == 'Feb' && date.getDate()>27)
    {
        var monthIndex = date.getMonth() + 1;
        var day = 1;
    }
    else
    {
      var day = date.getDate() + 1;
      // var day = 1;
      var monthIndex = date.getMonth();
    }
    
  }
  else
  {
    var monthIndex = date.getMonth();
    if (monthNames[monthIndex] == 'Enero' || monthNames[monthIndex] =='Mar' || monthNames[monthIndex] =='Mayo' || monthNames[monthIndex] =='Julio' || monthNames[monthIndex] =='Ago' || monthNames[monthIndex] =='Oct' || monthNames[monthIndex] =='Dic')
    {
      if (date.getDate()==30)
      {
        var day = date.getDate() + 1;
        // var day = 1;
      }
      else
      {
        if (monthNames[monthIndex] == 'Dic')
        {
          var monthIndex = 0;
          var day = 1;
          //console.log('4')
        }
        else
        {
          // var monthIndex = date.getMonth() + 1;
          var day = 2;
          //console.log('5')
        }
      }
      
    }
    else
    {
      if (date.getDate()==29)
      {
        var day = date.getDate() + 1;
        //console.log('6')
      }
      else
      {
          var monthIndex = date.getMonth() + 1;
          var day = 31;
          //console.log('7')
      }
    }

  }

  if ((monthNames[monthIndex] == 'Nov' && (day == 5 || day == 12 || day == 19 || day == 26)) || (monthNames[monthIndex] == 'Dic' && (day == 3 || day ==10 || day ==17 || day ==24 || day ==31)) || (monthNames[monthIndex] == 'Enero' && (day == 7 || day ==14 || day ==21 || day ==28)) || (monthNames[monthIndex] == 'Feb' && (day == 4 || day ==11 || day ==18 || day ==25)) || (monthNames[monthIndex] == 'Mar' && (day== 4 || day ==11 || day ==18 || day ==25)) || (monthNames[monthIndex] == 'Abril' && (day == 1 || day ==8 || day ==15 || day ==22 || day ==29)) || (monthNames[monthIndex] == 'Mayo' && (day == 6 || day ==13 || day ==20 || day == 27)) || (monthNames[monthIndex] == 'Junio' && (day == 3 || day ==10 || day ==17 || day ==24)) || (monthNames[monthIndex] == 'Julio' && (day == 1 || day == 8 || day ==15 || day ==22 || day ==29)) || (monthNames[monthIndex] == 'Ago' && (day == 5 || day ==12 || day ==19 || day ==26)) || (monthNames[monthIndex] == 'Sept' && (day == 2 || day ==9 || day ==16 || day ==23 || day ==30)) || (monthNames[monthIndex] == 'Oct' && (day == 7 || day ==14 || day ==21 || day ==28) ))
  {

    var day = day + 1;
    var domingo = true;
  }
  if ((monthNames[monthIndex] == 'Nov' && (day == 4 || day == 11 || day == 18 || day == 25)) || (monthNames[monthIndex] == 'Dic' && (day == 2 || day ==9 || day ==16 || day ==23 || day ==30)) || (monthNames[monthIndex] == 'Enero' && (day == 6 || day ==13 || day ==20 || day ==27)) || (monthNames[monthIndex] == 'Feb' && (day == 3 || day ==10 || day ==17 || day ==24)) || (monthNames[monthIndex] == 'Mar' && (day== 3 || day ==10 || day ==17 || day ==24 || day ==31)) || (monthNames[monthIndex] == 'Abril' && (day ==7 || day ==14 || day ==21 || day ==28)) || (monthNames[monthIndex] == 'Mayo' && (day == 5 || day ==12 || day ==19 || day == 26)) || (monthNames[monthIndex] == 'Junio' && (day == 2 || day ==9 || day ==16 || day ==23 || day==30)) || (monthNames[monthIndex] == 'Julio' && (day == 7 || day ==14 || day ==21 || day ==28)) || (monthNames[monthIndex] == 'Ago' && (day == 4 || day ==11 || day ==18 || day ==25)) || (monthNames[monthIndex] == 'Sept' && (day == 1 || day ==8 || day ==15 || day ==22 || day ==29)) || (monthNames[monthIndex] == 'Oct' && (day == 6 || day ==13 || day ==20 || day ==27) ))
  {

    var day = day + 2;
    sabado = true;
  }
  if (day > 30)
  {
    if (day==31)
    {
      if (monthNames[monthIndex] == 'Enero' || monthNames[monthIndex] =='Mar' || monthNames[monthIndex] =='Mayo' || monthNames[monthIndex] =='Julio' || monthNames[monthIndex] =='Ago' || monthNames[monthIndex] =='Oct' || monthNames[monthIndex] =='Dic')
      {

      }
      else
      {
        var monthIndex = date.getMonth() + 1;
          var day = 1;
      }
    }
    else if (day==32)
    {
      if (monthNames[monthIndex] == 'Enero' || monthNames[monthIndex] =='Mar' || monthNames[monthIndex] =='Mayo' || monthNames[monthIndex] =='Julio' || monthNames[monthIndex] =='Ago' || monthNames[monthIndex] =='Oct')
      {
        var monthIndex = date.getMonth() + 1;
          var day = 1;
      }
      else if (monthNames[monthIndex] =='Dic')
      {
        var monthIndex = 0;
          var day = 1;
      }
      else
      {
        var monthIndex = date.getMonth() + 1;
          var day = 2;
      }
    }
    else
    {
      if (monthNames[monthIndex] == 'Enero' || monthNames[monthIndex] =='Mar' || monthNames[monthIndex] =='Mayo' || monthNames[monthIndex] =='Julio' || monthNames[monthIndex] =='Ago' || monthNames[monthIndex] =='Oct')
      {
        var monthIndex = date.getMonth() + 1;
          var day = 2;
      }
      else if (monthNames[monthIndex] =='Dic')
      {
        var monthIndex = 0;
          var day = 2;
      }
      else
      {
        var monthIndex = date.getMonth() + 1;
          var day = 3;
      }
    }

    }   

    return day + ' ' + monthNames[monthIndex];

}

function formatDatepp (daymañana, monthmañana)
{
  var day = daymañana + 1;

  var monthNames = [
      "Enero", "Feb", "Mar",
      "Abril", "Mayo", "Junio", "Julio",
      "Ago", "Sept", "Oct",
      "Nov", "Dic"
    ];

  var monthIndex = monthNames.indexOf(monthmañana);

  if ((monthmañana == 'Nov' && (day == 5 || day == 12 || day == 19 || day == 26)) || (monthmañana == 'Dic' && (day == 3 || day ==10 || day ==17 || day ==24 || day ==31)) || (monthmañana == 'Enero' && (day == 7 || day ==14 || day ==21 || day ==28)) || (monthmañana == 'Feb' && (day == 4 || day ==11 || day ==18 || day ==25)) || (monthmañana == 'Mar' && (day== 4 || day ==11 || day ==18 || day ==25)) || (monthmañana == 'Abril' && (day == 1 || day ==8 || day ==15 || day ==22 || day ==29)) || (monthmañana == 'Mayo' && (day == 6 || day ==13 || day ==20 || day == 27)) || (monthmañana == 'Junio' && (day == 3 || day ==10 || day ==17 || day ==24)) || (monthmañana == 'Julio' && (day == 1 || day == 8 || day ==15 || day ==22 || day ==29)) || (monthmañana == 'Ago' && (day == 5 || day ==12 || day ==19 || day ==26)) || (monthmañana == 'Sept' && (day == 2 || day ==9 || day ==16 || day ==23 || day ==30)) || (monthmañana == 'Oct' && (day == 7 || day ==14 || day ==21 || day ==28) ))
    {
       day = day + 1;
    }

    if ((monthmañana == 'Nov' && (day == 4 || day == 11 || day == 18 || day == 25)) || (monthmañana == 'Dic' && (day == 2 || day ==9 || day ==16 || day ==23 || day ==30)) || (monthmañana == 'Enero' && (day == 6 || day ==13 || day ==20 || day ==27)) || (monthmañana == 'Feb' && (day == 3 || day ==10 || day ==17 || day ==24)) || (monthmañana == 'Mar' && (day== 3 || day ==10 || day ==17 || day ==24 || day ==31)) || (monthmañana == 'Abril' && (day ==7 || day ==14 || day ==21 || day ==28)) || (monthmañana == 'Mayo' && (day == 5 || day ==12 || day ==19 || day == 26)) || (monthmañana == 'Junio' && (day == 2 || day ==9 || day ==16 || day ==23 || day==30)) || (monthmañana == 'Julio' && (day == 7 || day ==14 || day ==21 || day ==28)) || (monthmañana == 'Ago' && (day == 4 || day ==11 || day ==18 || day ==25)) || (monthmañana == 'Sept' && (day == 1 || day ==8 || day ==15 || day ==22 || day ==29)) || (monthmañana == 'Oct' && (day == 6 || day ==13 || day ==20 || day ==27) ))
    {

       day = day + 2;
    }

  if (day > 30)
    {
                    console.log('entro1', day)

      if (day==31)
      {
        if (monthmañana == 'Enero' || monthmañana =='Mar' || monthmañana =='Mayo' || monthmañana =='Julio' || monthmañana =='Ago' || monthmañana =='Oct' || monthmañana =='Dic')
        {

        }
        else
        {
          var monthIndex = monthIndex + 1;
            var day = 1;
        }
      }
      else if (day==32)
      {
        if (monthmañana == 'Enero' || monthmañana =='Mar' || monthmañana =='Mayo' || monthmañana =='Julio' || monthmañana =='Ago' || monthmañana =='Oct')
        {
          var monthIndex = monthIndex + 1;
            var day = 1;
        }
        else if (monthmañana =='Dic')
        {
          var monthIndex = 0;
            var day = 1;
        }
        else
        {
          var monthIndex = monthIndex + 1;
            var day = 2;
        }
      }
      else
      {
        if (monthmañana == 'Enero' || monthmañana =='Mar' || monthmañana =='Mayo' || monthmañana =='Julio' || monthmañana =='Ago' || monthmañana =='Oct')
        {
          var monthIndex = monthIndex + 1;
            var day = 2;
        }
        else if (monthmañana =='Dic')
        {
          var monthIndex = 0;
            var day = 2;
        }
        else
        {
          var monthIndex = monthIndex + 1;
            var day = 3;
        }
      }

    }   

    

    return day + ' ' + monthNames[monthIndex];

}

function generaFechaSQL()
{
  var fechaSql = new Date();
  var horario = (fechaSql.getTimezoneOffset()/60);  
                      
  fechaSql.setHours(fechaSql.getHours() - horario);

  return fechaSql;
}

function contactoSQL(senderId)
{
  const request = new sql.Request(pool);

  request.input('idUsuario', sql.VarChar(50), senderId);
  request.input('fecha', sql.DateTime, generaFechaSQL());
  request.input('canal', sql.VarChar(50), 'Facebook Messenger');

  request.query('insert into contacto (idUsuario, fecha, canal) values (@idUsuario, @fecha, @canal)', (err, result) => 
  {
    if(err != null)
    {
      console.log(err);
      return;
    }   
  });
}

function agendaCitaSQL(senderId)
{
  const request = new sql.Request(pool);

  request.input('idUsuario', sql.VarChar(50), senderId);
  request.input('fecha', sql.DateTime, generaFechaSQL());

  request.query('insert into agendado (idUsuario, fecha) values (@idUsuario, @fecha)', (err, result) => 
  {
    if(err != null)
    {
      console.log(err);
      return;
    }   
  });
}

function actualizaNombreSQL(senderId, nombre)
{
  const request = new sql.Request(pool);

  request.input('senderId', sql.VarChar(50), senderId);
  request.input('nombre', sql.VarChar(70), nombre);

  request.query('update contacto set nombre = @nombre where idUsuario = @senderId', (err, result) => 
  {
    if(err != null)
    {
      console.log(err);
      return;
    }   
  });
}

function actualizaTelefonoSQL(senderId, telefono)
{
  const request = new sql.Request(pool);

  request.input('senderId', sql.VarChar(50), senderId);
  request.input('telefono', sql.VarChar(20), telefono);

  request.query('update contacto set telefono = @telefono where idUsuario = @senderId', (err, result) => 
  {
    if(err != null)
    {
      console.log(err);
      return;
    }   
  });
}

function actualizaCorreoSQL(senderId, email)
{
  const request = new sql.Request(pool);

  request.input('senderId', sql.VarChar(50), senderId);
  request.input('email', sql.VarChar(50), email);

  request.query('update contacto set email = @email where idUsuario = @senderId', (err, result) => 
  {
    if(err != null)
    {
      console.log(err);
      return;
    }   
  });
}

function filtroSQL(senderId, filtro)
{
  const request = new sql.Request(pool);

  request.input('senderId', sql.VarChar(50), senderId);
  request.input('filtro', sql.VarChar(30), filtro);
  request.input('fecha', sql.DateTime, generaFechaSQL());
  

  request.query('insert into filtro  values (@senderId, @filtro, @fecha)', (err, result) => 
  {
    if(err != null)
    {
      console.log(err);
      return;
    }   
  });
}

function vacantesServicio()
{
  var url = 'http://appext.pentafon.com/RhService/Service1.svc?wsdl';
  var args = {};

  soap.createClient(url, function(err, client)
  {
    if(err != "null")
    {
      client.GetVacantes(args, function(err, result)
      {
        if(err != "null")
        {
          var response = result.GetVacantesResult;

          return response;
        }
      });
    }
  });
}

function addZero(i)
{
  if (i < 10)
      i = "0" + i;  

  return i;
}

function fechaSMS()
{
  var today = new Date();
  var dd = addZero(today.getDate());
  var mm = addZero(today.getMonth() + 1);  
  var yyyy = today.getFullYear();
  var hour = addZero(today.getHours());
  var min = addZero(today.getMinutes());

  return dd + "/" + mm + "/" + yyyy + "/" + hour + "/" + min;
}

function enviaSMS(celular, cita)
{
  var url = 'http://www.calixtaondemand.com/ws/webServiceV10.php?wsdl';

  var citaSplit = cita.split(" ");
  var hora = citaSplit[1].replace("H", " hrs.");

  soap.createClient(url, function(err, client)
  {    
    if(err  != "null")
    {
      var args = {        
        idCliente: 47000,
        email: "atraccion@pentafon.com",
        password: "579153aeb7cc621ca625940a2ec3b16208115b881314033b6a4f3c396f682076",
        tipo: "SMS",
        fechaHora: fechaSMS(),
        telefono: celular,
        mensaje: "¿Estás listo? Porque vivirás una gran experiencia en el mejor lugar para trabajar. Te estaremos esperando con gusto, en el área de Atracción de Talento, el día " + citaSplit[0] + " a las " + hora + " en Mariano Escobedo 220, Col anahuac I Sección, C.P. 11320",
        idivr: 0      
      };

      client.EnviaMensaje(args, function(err, result)
      {
        if(err != "null")
        {
          var response = result.return.$value;

          console.log(response);
        }
      });
    }
  });
}

function candidato(args, sender, Callback)
{
  var url = 'http://appext.pentafon.com/RhService/Service1.svc?wsdl';

  soap.createClient(url, function(err, client) 
  {
    if(err != "null")
    {
      client.GuardaAspirantePentafon(args, function(err, result) 
      {  
        if(err != "null")
        {
          var response = result.GuardaAspirantePentafonResult;
          
          try
          {
            console.log(response.Id);
            console.log(response.Msg);

            if (response.Msg == "CANDIDATO")
            {
              var msg = 'Gracias, nos gustaría agendar una cita contigo en Pentafon, ¿Cual de estos horarios te conviene?';

              async2.series([
                function sendMsg(stp)
                {
                  FB.fbMessage(sender, msg , (err, data) => {
                  
                    if (err)
                      console.log('Oops1! An error occurred while forwarding the response to', recipientId, ':', err);
                  
                    stp();
                  });
                }
              ]);
              Callback({idCandidato: response.Id, candidato: true});
            }
            else
            {
              var msg = 'Te agradecemos mucho el habernos buscado ' + connectedUser1 + '. Desgraciadamente, por el momento no contamos con plazas adecuadas a tu perfil, pero por favor contáctanos de nuevo en el futuro.';

              async2.series([
                function sendMsg(stp)
                {
                  FB.fbMessage(sender, msg, (err, data) => {
                  
                    if (err)
                      console.log('Oops2! An error occurred while forwarding the response to', recipientId, ':', err);
                  
                    stp();
                  });
                }
              ]);
              Callback({idCandidato: response.Id, candidato: false});
            }
              
          }
          catch(err)
          {
            console.log("Error al obtener la informacion: " + err)
            Callback(false)
          }
        }            
      });
    }
    else
      console.log("No se pudo crear el cliente para GuardaAspirantePentafon: " + err);
      Callback(false)
  });  
}

function agendaCita(idCandidato, idGrupo)
{
  var url = 'http://appext.pentafon.com/RhService/Service1.svc?wsdl';
  var args = {        
      grupoid: Number(idGrupo),
      aspiranteid: Number(idCandidato)    
  };

  soap.createClient(url, function(err, client) 
  {
    if(err != "null")
    {
      client.AsignacionGrupo(args, function(err, result) 
      {  
        if(err != "null")
        {
          var response = result.AsignacionGrupoResult;
          
          try
          {
            console.log(response);              
          }
          catch(err)
          {
            console.log("Error al guardar la informacion: " + err)            
          }
        }            
      });
    }
    else
      console.log("No se pudo crear el cliente para AsignacionGrupo: " + err);      
  });  
}

var connectedUserData = {};
var usernames = [];

app.get('/', function(req, res)
{
  console.log("Pentafon RH");
  res.sendStatus(200);
});

app.post('/webhook', function(req, res)
{
  var mensaje = req.query.message;
  const sender = req.query.senderId;
  var payload = req.query.payload;
  
  if (mensaje) 
  {
    const sessionId = findOrCreateSession(sender);

    // We retrieve the message content

    mensaje = mensaje.substr(0, 255);
    mensaje = mensaje.replace(/á/g, 'a');
    mensaje = mensaje.replace(/é/g, 'e');
    mensaje = mensaje.replace(/í/g, 'i');
    mensaje = mensaje.replace(/ó/g, 'o');
    mensaje = mensaje.replace(/ú/g, 'u');
    mensaje = mensaje.replace(/Á/g, 'A');
    mensaje = mensaje.replace(/É/g, 'E');
    mensaje = mensaje.replace(/Í/g, 'I');
    mensaje = mensaje.replace(/Ó/g, 'O');
    mensaje = mensaje.replace(/Ú/g, 'U');
    
    const msg = mensaje; 

    var context = {forecast:"", missingIntent:false};

    async.series([

      function getName(step)
      {
        if (connectedUserData[sessionId]==undefined)
        {  
          var url = 'https://graph.facebook.com/v2.6/'
          url += sender
          url += '?fields=first_name,last_name&access_token='
          url += Config.FB_PAGE_TOKEN;

          var nombre = undefined;
          var apellido = undefined;

          request({
            url: url,
            json: true
          }, 
          function (error, response, body) 
          {
            if (body != undefined)
            {
              var nombre = body.first_name;
              var apellido = body.last_name;
            }
                           
            connectedUserData[sessionId] = {
              "usuario": nombre,
              "apellido": apellido,
              "sendChat": false,
              "a2": 0,
              "ff": 0,
              "pg":0,
              "pgs":0,
              "pvac":0,
              "ch":0,
              "rep":0,
              "rep3":0,
              "unknownIntentCount": 2,
              "wit":  generateWitClient(sender)     
            };

            contactoSQL(sender);

            step();
          });
        }
        else
          step();
      },

      function getInfoAndWorksheets(step) 
      {
        var sueldo;
        var Ser=[];

        doc.getInfo(function(err, info) 
        {          
          sheet = info.worksheets[0];          
          sheet.getRows({
            offset: 1,
            limit: 20
          }, 
          function( err, rows )
          {            
            xl = rows;
            step();
          });
        });
      },

      function getBotAns(step) 
      {
     
        connectedUserData[sessionId].wit.message(msg).then(({entities}) => {
          
          var socketID = sessionId;
          var nohola = msg.length;      
          var hola = entities['hola'] || [];
          var gracias = entities['gracias'] || [];
          var ok = entities['ok'] || [];
          var intent = entities['intent'] || [];
          var continua = entities['continua'] || [];
          var tipo = entities['tipo'] || [];
          var salario = entities['salario'] || [];
          var edad = entities['edad'] || [];
          var dist = entities['dist'] || [];
          var espera = entities['espera'] || [];
          var servicio = entities['servicio'] || [];
          var turno = entities['turno'] || [];
          var estudios = entities['estudios'] || [];
          var amount = entities['amount_of_money'] || [];
          var tiempo = entities['tiempo'] || [];   
          var periodo = entities['periodo'] || []; 
          var email = entities['email'] || [];
          var mes = entities['mes'] || [];    
          var money = entities['money'] || [];
          var lugar = entities['lugar'] || [];
          var extras = entities['extras'] || [];
          var misc = entities['misc'] || [];

          if (money.length>0)           
            amount = money;
          
          if ((new RegExp('[?]')).test(msg))          
            var pregunta = true;          
          else          
            var pregunta = false;

          var connectedUser = connectedUserData[sessionId]["usuario"];

          if(connectedUser != undefined)
            var connectedUser1 = connectedUser.charAt(0).toUpperCase() + connectedUser.slice(1);
       
          ///Espereme
          if(espera.length>0)
          {
            delete context.missingIntent;
            context.forecast = 'Por su supuesto, avíseme cuando esté listo.';  
          }

          else if (connectedUserData[sessionId]['sendChat'] == true)
          {
            delete context.missingIntent;
            context.forecast = ' ';  
          }
          else if (extras.length>0)
          {
            delete context.missingIntent;
            context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
            connectedUserData[sessionId]['sendChat'] = true;
            atiende(connectedUserData[sessionId]['usuario']);
          }
                    
                    
          ///HOLA
          else if ((hola.length>0) && !(intent.length>0) && !(gracias.length>0) && !(espera.length>0) && !(salario.length>0)) 
          {
            if (nohola > 25) 
            {
                if (connectedUserData[sessionId]['sendChat'] == true)
                {
                  delete context.missingIntent;
                  context.forecast = ' ';        
                  atiende(connectedUserData[sessionId]['usuario']);
                }
                else
                {
                  // console.log('1');
                  delete context.missingIntent;
                  context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                  connectedUserData[sessionId]['sendChat'] = true;
                  atiende(connectedUserData[sessionId]['usuario']);
                }
            }
            else
            {
              var hey = ['Hola ' + connectedUser1 + '! ¿En que te puedo ayudar hoy?', 'Hola ' + connectedUser1 + '! ¿Cómo te puedo ayudar hoy?', 'Hola ' + connectedUser1 + '! ¿Qué puedo hacer por ti hoy?', 'Hola ' + connectedUser1 + '! ¿En qué te puedo servir hoy?' ];
              var randi = hey[Math.floor(Math.random() * hey.length)];
              context.forecast = randi; 
            }
          }

          ////Trabajo
          else if (!(extras.length>0) && turno.find(findTFinde) && intent.find(findChamba))
          {
            context.forecast = 'Para fin de semana tenemos una campaña de portabilidad en la cual debes cumplir una jornada de 31 horas entre el viernes y el domingo. ¿Estas interesado en trabajar con nosotros?';
            connectedUserData[sessionId]['pgs'] = 1;
            connectedUserData[sessionId]['ch'] = 1;                    
          }

          else if (!(extras.length>0) && misc.find(findMiscPrestaciones))
            context.forecast = 'Efectivamente ofrecemos prestaciones de Ley: aguinaldo, vacaciones, prima vacional, prima dominical, IMSS, y un contrato indeterminado.';

          else if (!(extras.length>0) && misc.find(findMiscHorarios))
            context.forecast = 'De lunes a sábado los horarios matutinos son: de 9 a 3 pm y los vespertinos: de 3 a 9 pm.'

          else if (!(extras.length>0) && (intent.length>0 && intent.find(findChamba) && !(email.length>0) || connectedUserData[sessionId]['ch']==1 || connectedUserData[sessionId]['pg']>0 || salario.length>0 || connectedUserData[sessionId]['ch']==3 && servicio.length>0 || connectedUserData[sessionId]['ch']==2))
          {
            if (connectedUserData[sessionId]['pvac']==1 && intent.find(findChamba))
            {
              context.forecast = 'davacantes';
              connectedUserData[sessionId]['ch'] =1;
              connectedUserData[sessionId]['pvac']=2;
            }

            else if (connectedUserData[sessionId]['pvac']==2)
            {
              if(continua.find(findContiNeg))
              {
                context.forecast = 'Gracias. Dejamos tus datos registrados y nos comunicamos contigo si surge una vacante de tu interés.'
                connectedUserData[sessionId]['ch'] =1;
                connectedUserData[sessionId]['pvac']=2;
                connectedUserData[sessionId]['ch'] =0;
                connectedUserData[sessionId]['sendChat'] = true;
                connectedUserData[sessionId]['cita'] = 'USUARIO PASÓ FILTO PERO NO AGENDÓ CITA POR: '+ msg;
                             
                if (connectedUserData[sessionId]['rep3']==0)
                {  
                  rep3();
                  connectedUserData[sessionId]['rep3']=1;
                }

                rep1(connectedUserData[sessionId])
                atiende(connectedUserData[sessionId]['usuario']);
              }

              else if (connectedUserData[sessionId]['pg'] == 6)
              {
                //dar las vacantes
                context.forecast = 'Excelente! Nos gustaría agendar una cita contigo en Pentafon, ¿Cual de estos horarios te conviene?';
                connectedUserData[sessionId]['pg'] = 6;
                connectedUserData[sessionId]['pvac']=3;
              }

              else if (connectedUserData[sessionId]['pg'] == 5)
              {
                context.forecast = '¿Cuanto tiempo harás de tu casa o de un destino previo a Pentafon (Laguna del Mayran 258, Colonia Anahuac, 11320, Del. Miguel Hidalgo)?';
                connectedUserData[sessionId]['pg'] = 5;
                connectedUserData[sessionId]['pvac']=3;
              }

              else if (connectedUserData[sessionId]['pg'] == 4)
              {
                context.forecast = 'Excelente! ¿Cuales son tus pretenciones económicas, cuanto esperas ganar? (Ej. 5000 pesos al mes + comisiones)';
                connectedUserData[sessionId]['pg'] = 4;
                connectedUserData[sessionId]['pvac']=3;
              }

              else if (connectedUserData[sessionId]['pg'] == 3)
              {
                //context.forecast = 'Excelente! ¿Cuentas con un grado mínimo de estudios de preparatoria trunca, en curso o concluida?';
                context.forecast = 'Excelente! ¿Cúal es tu grado máximo de estudios?';
                connectedUserData[sessionId]['pg'] =3;
                connectedUserData[sessionId]['pvac']=3;
              }

              else if (connectedUserData[sessionId]['pg'] == 2)
              {
                context.forecast = 'Excelente! ¿Qué edad tienes?';
                connectedUserData[sessionId]['pg'] =2;
                connectedUserData[sessionId]['pvac']=3;
              }

              else if (connectedUserData[sessionId]['pg']==43)
              {
                context.forecast = 'Excelente! ¿Has trabajado anteriormente en Pentafon?';
                connectedUserData[sessionId]['tel'] = msg;
                connectedUserData[sessionId]['pg'] =43;
                connectedUserData[sessionId]['pvac']=3;

                actualizaTelefonoSQL(sender, msg);
              }

              else if (connectedUserData[sessionId]['pg'] == 20)
              {                  
                context.forecast = 'Excelente! ¿un número telefónico para localizarte?';
                connectedUserData[sessionId]['fullname'] = msg;
                connectedUserData[sessionId]['pg'] =20;
                connectedUserData[sessionId]['pvac']=3;

                actualizaNombreSQL(sender, msg);
              }

              else if (connectedUserData[sessionId]['ch'] == 1 && connectedUserData[sessionId]['pg']==0)
              {
                delete context.missingIntent;
                context.forecast = 'Excelente, ¿cuál es tu nombre completo?';
                connectedUserData[sessionId]['pg'] =1;
                connectedUserData[sessionId]['ch'] =0;
                connectedUserData[sessionId]['pvac']=3;
                corvac(connectedUser);                  
              }

              else
              {
                delete context.missingIntent;
                context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                connectedUserData[sessionId]['sendChat'] = true;
                atiende(connectedUserData[sessionId]['usuario']);
              }
            }

            else if (connectedUserData[sessionId]['ch']==0 && connectedUserData[sessionId]['pg']==0 && !(salario.length>0))
            {
              connectedUserData[sessionId]['pvac']=1;

              if (tipo.find(findTipoSuperv))
              {
                context.forecast = '¿Estás interesado en trabajar con nosotros?';
                connectedUserData[sessionId]['pgs'] = 1;
                connectedUserData[sessionId]['ch'] = 1;
              }
              else
              {
                if (lugar.find(findMorelia))
                {
                   context.forecast = 'Permíteme un momento ' + connectedUser1 + ', enseguida te pasamos las vacantes de Morelia';
                   connectedUserData[sessionId]['sendChat'] = true;
                   atiende(connectedUserData[sessionId]['usuario']);
                }
                else
                {
                  //context.forecast = 'davacantes';
                  context.forecast = '¿Estás interesado en trabajar con nosotros?'
                  connectedUserData[sessionId]['ch'] =1;
                  connectedUserData[sessionId]['pg'] = 1;
                }                           
              }    
            }

            else if (connectedUserData[sessionId]['ch']==1 && !(servicio.length>0) && !(salario.length>0) && connectedUserData[sessionId]['pg']==0 )
            {
              if (continua.find(findContiNeg))
              {
                context.forecast = 'De acuerdo, ¿en qué te podemos ayudar?'
                connectedUserData[sessionId]['ch'] =0;
                connectedUserData[sessionId]['sendChat'] = true;
                atiende(connectedUserData[sessionId]['usuario']);
              }

              else if (continua.find(findContiPos) && !(salario.length>0))
              {
                delete context.missingIntent;
                context.forecast = 'Bien, ¿cuál es tu nombre completo?';
                connectedUserData[sessionId]['pg'] =1;
                connectedUserData[sessionId]['ch'] =0;
                connectedUserData[sessionId]['pvac']=3;                
                corvac(connectedUser);                                
              }

              else 
              {
                if (connectedUserData[sessionId]['sendChat'] == true)
                {
                  delete context.missingIntent;
                  context.forecast = ' ';        
                  atiende(connectedUserData[sessionId]['usuario']);
                }

                else
                {
                  // console.log('2');
                  delete context.missingIntent;
                  context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                  connectedUserData[sessionId]['sendChat'] = true;
                  atiende(connectedUserData[sessionId]['usuario']);
                }                                
              }
            }

            else if (connectedUserData[sessionId]['pg']>0 && !(connectedUserData[sessionId]['pg']==11 && !(email.length>0)) && !(connectedUserData[sessionId]['pg']==6 && !(mes.length>0) && !(intent.find(findChamba))))
            {
              if (connectedUserData[sessionId]['pg']==1)
              {
                context.forecast = 'Gracias y ¿un número telefónico para localizarte?';
                connectedUserData[sessionId]['fullname'] = msg;
                connectedUserData[sessionId]['pg'] =20;

                actualizaNombreSQL(sender, msg);
              }

              else if (connectedUserData[sessionId]['pg']==20)
              {
                  context.forecast = '¿Has trabajado anteriormente en Pentafon?';
                  connectedUserData[sessionId]['tel'] = msg;
                  connectedUserData[sessionId]['pg'] =43;
                  
                  actualizaTelefonoSQL(sender, msg);
              }

              else if (connectedUserData[sessionId]['pg']==43)
              {
                //Guardar mensaje DE REINGRESO
                if (continua.find(findContiPos))
                {
                  connectedUserData[sessionId]['exp'] = 'REINGRESO';
                  context.forecast = 'Perfecto, déjanos validar tu reingreso y nos comunicamos contigo por teléfono.';
                  connectedUserData[sessionId]['sendChat'] = true;
                  var cad = 'NUEVO CANDIDATO <br>' + 'Nombre: ' + connectedUserData[sessionId]['usuario']  + '<br>' +
                  'Nombre Completo: ' + connectedUserData[sessionId]['fullname']  + '<br>' +
                  'Teléfono: ' + connectedUserData[sessionId]['tel']  + '<br>' +
                  //'Fecha Cita: ' + connectedUserData[sessionId]['cita']  + '<br>' +
                  //'Email ' + connectedUserData[sessionId]['email']  + '<br>' +
                  'Reingreso: ' + connectedUserData[sessionId]['exp']  + '<br>' +
                  //'Edad: ' + connectedUserData[sessionId]['edad']  + '<br>' +
                  //'Bachillerato: ' + connectedUserData[sessionId]['bach']  + '<br>' +
                  //'Pretenciones Económicas: ' + connectedUserData[sessionId]['otroproc']  + '<br>' +
                  //'Distancia a Pentafon: ' + connectedUserData[sessionId]['numproc']  + '<br>' + 
                  '<br>';
                  corre(cad);  
                  rep1(connectedUserData[sessionId])
                  rep2(connectedUserData[sessionId])
                }

                else 
                {
                  connectedUserData[sessionId]['exp'] = 'NO'
                  context.forecast = '¿Qué edad tienes?';
                  connectedUserData[sessionId]['pg'] =2;
                }
              }

              else if (connectedUserData[sessionId]['pg']==2)
              {
                if (edad.length>0)
                {
                  if ((edad[0]['value']>55 || edad[0]['value']<=17) && !(connectedUserData[sessionId]['pgs']==1))
                  {
                    filtroSQL(sender, 'Edad');
                    context.forecast = 'Te agradecemos mucho el habernos buscado ' + connectedUser1 + '. Desgraciadamente, por el momento no contamos con plazas adecuadas a tu perfil, pero por favor contáctanos de nuevo en el futuro.';
                    connectedUserData[sessionId]['ch'] =0;

                    if(connectedUserData[sessionId]['rep3']==0)
                    {  
                      rep3();
                      connectedUserData[sessionId]['rep3']=1;
                    }

                    connectedUserData[sessionId]['sendchat'] =true;
                  }

                  else 
                  {
                    //Guardar mensaje
                    context.forecast = 'Gracias, ¿Cúal es tu grado máximo de estudios?';
                    //context.forecast = 'Gracias, ¿Cuentas con un grado mínimo de estudios de preparatoria trunca, en curso o concluida?';
                    connectedUserData[sessionId]['pg'] =3;
                    connectedUserData[sessionId]['edad'] = edad[0]['value'];
                  }
                }

                else
                {
                    context.forecast = 'No entendí. ¿Me lo repite de favor?'
                }                              
              }

              else if (connectedUserData[sessionId]['pg']==3)
              {
                if ((continua.find(findContiNeg) || estudios.find(findNoEstudio)) && !(connectedUserData[sessionId]['pgs']==1))
                {
                  filtroSQL(sender, 'Estudios');
                  context.forecast = 'Te agradecemos mucho el habernos buscado ' + connectedUser1 + '. Desgraciadamente, por el momento no contamos con plazas adecuadas a tu perfil, pero por favor contáctanos de nuevo en el futuro.';
                  connectedUserData[sessionId]['ch'] =0;

                  if(connectedUserData[sessionId]['rep3']==0)
                  {  
                    rep3();
                    connectedUserData[sessionId]['rep3']=1;
                  }
                  
                  connectedUserData[sessionId]['sendchat'] =true;
                }

                else 
                {
                   //Guardar mensaje
                  context.forecast = '¿Cuales son tus pretenciones económicas, cuanto esperas ganar? (Ej. 5000 pesos al mes + comisiones)';
                  connectedUserData[sessionId]['pg'] = 4;
                  connectedUserData[sessionId]['bach'] = payload;
                }                               
              }

              else if (connectedUserData[sessionId]['pg'] == 4)
              {                                
                if (periodo.find(findPerMensual))
                {
                  if (amount[0]['value']>8000 && !(connectedUserData[sessionId]['pgs']==1))
                  {
                    filtroSQL(sender, 'Sueldo');
                    context.forecast = 'Te agradecemos mucho el habernos buscado ' + connectedUser1 + '. Desgraciadamente, por el momento no contamos con plazas adecuadas a tu perfil, pero por favor contáctanos de nuevo en el futuro.';
                    connectedUserData[sessionId]['ch'] = 0;

                    if(connectedUserData[sessionId]['rep3']==0)
                      {  
                        rep3();
                        connectedUserData[sessionId]['rep3']=1;
                      }        

                      connectedUserData[sessionId]['sendchat'] =true;
                  }

                  else
                  {
                    context.forecast = '¿Cuanto tiempo harás de tu casa o de un destino previo a Pentafon (Laguna del Mayran 258, Colonia Anahuac, 11320, Del. Miguel Hidalgo)?';
                    connectedUserData[sessionId]['pg'] = 5;
                    connectedUserData[sessionId]['otroproc'] = '$' + amount[0]['value'] + ' mensual';
                  }
                }

                else if (periodo.find(findPerDiario))
                {
                  if (amount[0]['value']>310 && !(connectedUserData[sessionId]['pgs']==1))
                  {
                    filtroSQL(sender, 'Distancia');
                    context.forecast = 'Te agradecemos mucho el habernos buscado ' + connectedUser1 + '. Desgraciadamente, por el momento no contamos con plazas adecuadas a tu perfil, pero por favor contáctanos de nuevo en el futuro.';
                    connectedUserData[sessionId]['ch'] =0;

                    if(connectedUserData[sessionId]['rep3']==0)
                    {  
                      rep3();
                      connectedUserData[sessionId]['rep3']=1;
                    }

                    connectedUserData[sessionId]['sendchat'] =true;
                  }
                  else
                  {
                    context.forecast = '¿Cuanto tiempo harás de tu casa a Pentafon (Laguna del Mayran 258, Colonia Anahuac, 11320, Del. Miguel Hidalgo)?';
                    connectedUserData[sessionId]['pg'] = 5;
                    connectedUserData[sessionId]['otroproc'] = '$' + amount[0]['value'] + ' diario';
                  }
                }

                else
                {
                  if (amount.length>0)
                  {
                    if (amount[0]['value']>8000 && !(connectedUserData[sessionId]['pgs']==1))
                    {
                      filtroSQL(sender, 'Sueldo');
                      context.forecast = 'Te agradecemos mucho el habernos buscado ' + connectedUser1 + '. Desgraciadamente, por el momento no contamos con plazas adecuadas a tu perfil, pero por favor contáctanos de nuevo en el futuro.';
                      connectedUserData[sessionId]['ch'] =0;

                      if(connectedUserData[sessionId]['rep3']==0)
                      {  
                        rep3();
                        connectedUserData[sessionId]['rep3']=1;
                      }

                      connectedUserData[sessionId]['sendchat'] =true;
                    }

                    else
                    {
                      context.forecast = '¿Cuanto tiempo harás de tu casa a Pentafon (Laguna del Mayran 258, Colonia Anahuac, 11320, Del. Miguel Hidalgo)?';
                      connectedUserData[sessionId]['pg'] = 5;

                      if (amount.length>0)                      
                         connectedUserData[sessionId]['otroproc'] = '$' + amount[0]['value'] + ' mensual';
                      else
                          connectedUserData[sessionId]['otroproc'] = '$' + msg + ' ';
                    }
                  }

                  else
                  {
                    context.forecast = '¿Cuanto tiempo harás de tu casa a Pentafon (Laguna del Mayran 258, Colonia Anahuac, 11320, Del. Miguel Hidalgo)?';
                    connectedUserData[sessionId]['pg'] = 5;

                    if (amount.length>0)                    
                       connectedUserData[sessionId]['otroproc'] = '$' + amount[0]['value'] + ' mensual';                    
                    else                    
                        connectedUserData[sessionId]['otroproc'] = '$' + msg + ' ';  
                  }
                }
              }

              else if (connectedUserData[sessionId]['pg']==5)
              {
                if (!(dist.length>0) || !(tiempo.length>0))
                {
                  //dar las vacantes
                  context.forecast = 'Gracias, nos gustaría agendar una cita contigo en Pentafon, ¿Cual de estos horarios te conviene?';
                  connectedUserData[sessionId]['pg'] = 6;
                  connectedUserData[sessionId]['numproc'] = payload;
                }
                else if (tiempo.find(findTmin))
                {
                  if (dist[0]['value']>=90 && !(connectedUserData[sessionId]['pgs']==1))
                  {
                    filtroSQL(sender, 'Distancia');
                    context.forecast = 'Te agradecemos mucho el habernos buscado ' + connectedUser1 + '. Desgraciadamente, por el momento no contamos con plazas adecuadas a tu perfil, pero por favor contáctanos de nuevo en el futuro.';
                    connectedUserData[sessionId]['ch'] =0;

                    if(connectedUserData[sessionId]['rep3']==0)
                      {  
                        rep3();
                        connectedUserData[sessionId]['rep3']=1;
                      }

                      connectedUserData[sessionId]['sendchat'] =true;                      
                  }

                  else
                  {
                    //dar las vacantes
                    //context.forecast = 'Gracias, nos gustaría agendar una cita contigo en Pentafon, ¿Cual de estos horarios te conviene?';

                    var sueldo = 0;                    
                    var edadFiltro = false;
                    var sueldoFiltro = false;
                    var escolarFiltro = false;
                    var distFiltro = false;                 
                    var escolaridad = "";

                    var sdo = connectedUserData[sessionId]['otroproc'].substr(1);
                    var sueldoString = sdo.substr(0, sdo.indexOf(" "));

                    connectedUserData[sessionId]['pg'] = 6;
                    connectedUserData[sessionId]['numproc'] = payload;      
                    
                    var nomSplit = connectedUserData[sessionId]['fullname'].split(" ");

                    sueldo = Number(sueldoString);

                    escolaridad = connectedUserData[sessionId]['bach'];

                    if(sueldo <= 7000)
                      sueldoFiltro = true;

                    if(connectedUserData[sessionId]['edad'] >= 18 && connectedUserData[sessionId]['edad'] <= 60)
                      edadFiltro = true;

                    if(escolaridad == "3" || escolaridad == "4" || escolaridad == "5" || escolaridad == "6")
                      escolarFiltro = true;

                    if(payload == "1" || payload == "2" || payload == "3")
                      distFiltro = true;

                    var args = {
                      vm: {
                        ApellidoMaterno: " ",
                        ApellidoPaterno: nomSplit[1],
                        Celular: connectedUserData[sessionId]['tel'],
                        EspectativaEconomica: Number(sueldoString),
                        Experiencia: "",
                        FiltroEdad: edadFiltro,
                        FiltroEspectativaEconomica: sueldoFiltro,
                        FiltroExperiencia: true,
                        FiltroNivelEstudios: escolarFiltro,
                        FiltroTiempoTrayecto: distFiltro,
                        FiltroTrabajoEnPentafon: true,
                        FiltroUltimoEmpleo: true,
                        FuenteContacto: "10",
                        NivelEstudios: escolaridad,
                        Nombre: nomSplit[0],
                        TiempoTrayecto: payload,
                        TrabajoEnPentafon: false
                      }
                    };

                    context.forecast = 'Agradecemos tu información.';
                    candidato(args, sender, function(candidatoCallback)
                    {
                      if(candidatoCallback.candidato)     
                      {

                        context.forecast = 'Gracias, nos gustaría agendar una cita contigo en Pentafon, ¿Cual de estos horarios te conviene?';

                        connectedUserData[sessionId]['pg'] = 7;
                        connectedUserData[sessionId]['numCandidato'] = candidatoCallback.idCandidato;  
                        connectedUserData[sessionId]['sendchat'] =false;
                      }                                         
                      else
                      {
                        context.forecast = 'Te agradecemos mucho el habernos buscado ' + connectedUser1 + '. Desgraciadamente, por el momento no contamos con plazas adecuadas a tu perfil, pero por favor contáctanos de nuevo en el futuro.';
                        connectedUserData[sessionId]['ch'] =0;
                        if(connectedUserData[sessionId]['rep3']==0)
                        {  
                          rep3();
                          connectedUserData[sessionId]['rep3']=1;
                        }
                      
                        connectedUserData[sessionId]['sendchat'] =true;


                      }
                    });
                  
                    console.log("aqui");
                  }
                  
                }

                else if (tiempo.find(findThoras))
                {
                  if (dist[0]['value']>=2 && !(connectedUserData[sessionId]['pgs']==1))
                  {
                    filtroSQL(sender, 'Distancia');
                    context.forecast = 'Te agradecemos mucho el habernos buscado ' + connectedUser1 + '. Desgraciadamente, por el momento no contamos con plazas adecuadas a tu perfil, pero por favor contáctanos de nuevo en el futuro.';
                    connectedUserData[sessionId]['ch'] =0;
                    if(connectedUserData[sessionId]['rep3']==0)
                    {  
                      rep3();
                      connectedUserData[sessionId]['rep3']=1;
                    }

                    connectedUserData[sessionId]['sendchat'] =true;
                  }
                  else
                  {
                    //dar las vacantes
                    context.forecast = 'Gracias, nos gustaría agendar una cita contigo en Pentafon, ¿Cual de estos horarios te conviene?';
                    connectedUserData[sessionId]['pg'] = 6;
                    connectedUserData[sessionId]['numproc'] = payload;
                  }
                }

                else
                {
                  if (dist[0]['value']>=90 && !(connectedUserData[sessionId]['pgs']==1))
                  {
                    filtroSQL(sender, 'Distancia');
                    context.forecast = 'Te agradecemos mucho el habernos buscado ' + connectedUser1 + '. Desgraciadamente, por el momento no contamos con plazas adecuadas a tu perfil, pero por favor contáctanos de nuevo en el futuro.';
                    connectedUserData[sessionId]['ch'] =0;

                    if(connectedUserData[sessionId]['rep3']==0)
                    {  
                      rep3();
                      connectedUserData[sessionId]['rep3']=1;
                    }

                    connectedUserData[sessionId]['sendchat'] =true;
                  }
                  else
                  {
                    //dar las vacantes
                    context.forecast = 'Gracias, nos gustaría agendar una cita contigo en Pentafon, ¿Cual de estos horarios te conviene?';
                    connectedUserData[sessionId]['pg'] = 6;
                    connectedUserData[sessionId]['numproc'] = payload;
                  }
                }  
              }

              else if (connectedUserData[sessionId]['pg']==7)
              {
                //Guardar mensaje
                connectedUserData[sessionId]['cita'] = msg;                            
                context.forecast = 'Perfecto ' + connectedUser1 + ', ¿Me pudieras pasar tu correo electrónico para mandarte un mail con más información de tu cita?';
                connectedUserData[sessionId]['pg']=11; 

                agendaCita(connectedUserData[sessionId]['numCandidato'], payload);

                corvac('AGENDÓ: ' + connectedUser + ' el ' + msg);
                
                agendaCitaSQL(sender);
              }

              else if (connectedUserData[sessionId]['pg']==11)
              {
                //Guardar mensaje
                connectedUserData[sessionId]['email'] = email[0]['value'];

                actualizaCorreoSQL(sender, email[0]['value']);

                coper(connectedUserData[sessionId]['usuario'], connectedUserData[sessionId]['email'], connectedUserData[sessionId]['cita']);            
                enviaSMS(connectedUserData[sessionId]['tel'], connectedUserData[sessionId]['cita']);
                context.forecast = 'Gracias, ya te mandamos el correo. Por favor avísame cuando te llegue.';
                connectedUserData[sessionId]['pg'] = 8;  
                var cad = 'NUEVO CANDIDATO <br>' + 'Nombre: ' + connectedUserData[sessionId]['usuario']  + '<br>' +
                'Nombre Completo: ' + connectedUserData[sessionId]['fullname']  + '<br>' +
                'Teléfono: ' + connectedUserData[sessionId]['tel']  + '<br>' +
                'Fecha Cita: ' + connectedUserData[sessionId]['cita']  + '<br>' +
                'Email ' + connectedUserData[sessionId]['email']  + '<br>' +
                'Reingreso: ' + connectedUserData[sessionId]['exp']  + '<br>' +
                'Edad: ' + connectedUserData[sessionId]['edad']  + '<br>' +
                'Bachillerato: ' + connectedUserData[sessionId]['bach']  + '<br>' +
                'Pretenciones Económicas: ' + connectedUserData[sessionId]['otroproc']  + '<br>' +
                'Distancia a Pentafon: ' + connectedUserData[sessionId]['numproc']  + '<br><br>';
                corre(cad);  
                rep1(connectedUserData[sessionId])
                rep2(connectedUserData[sessionId])
                cap(connectedUserData[sessionId])                           
              }
              
              else if (connectedUserData[sessionId]['pg']==8)
              {
                if (continua.find(findContiNeg)) 
                {
                  context.forecast = 'Ok. ¿Tu correo es: ' + connectedUserData[sessionId]['email'] + ' ?' ;
                  connectedUserData[sessionId]['pg'] = 9;
                }

                else if (pregunta == true)
                {
                  delete context.missingIntent;
                  context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                  connectedUserData[sessionId]['sendChat'] = true;
                  atiende(connectedUserData[sessionId]['usuario']);
                }

                else
                {
                  context.forecast = 'Muchas gracias por tu tiempo, te esperamos para tu cita. Cualquier duda por favor contáctanos de nuevo. ¿De casualidad conocerás a alguien que le interesaría una vacante similar? Si es así, me pasarías su correo, de favor?' ;
                  connectedUserData[sessionId]['pg'] = 10;
                }
              }

              else if (connectedUserData[sessionId]['pg']==10)
              {
                if (continua.find(findContiNeg)) 
                {
                  context.forecast = 'De acuerdo, gracias de todas maneras. Nos vemos para tu cita el: ' + connectedUserData[sessionId]['cita'] + ', ' + connectedUser1 + '! Muy buen día.' ;
                  connectedUserData[sessionId]['ff'] = 1;
                  connectedUserData[sessionId]['sendChat'] = true;
                }

                else 
                {
                  //Guardar datos y mandar correo
                  context.forecast = 'Muchas gracias por el apoyo. Nos vemos para tu cita el: ' + connectedUserData[sessionId]['cita'] + ', ' + connectedUser1 + '! Muy buen día.' ;
                  connectedUserData[sessionId]['ff'] = 1;
                  connectedUserData[sessionId]['sendChat'] = true;

                  if(email.length>0)
                    referido(email[0].value, connectedUserData[sessionId]['fullname'])
                }
              }                            
            }

            else if (salario.length>0 || ((connectedUserData[sessionId]['ch']==1 && (servicio.length>0 || salario.length>0)) || connectedUserData[sessionId]['ch']==2 || connectedUserData[sessionId]['ch']==3 && servicio.length>0))
            {
              if ((salario.length>0 && servicio.length>0 && !(connectedUserData[sessionId]['ch']==2)) || connectedUserData[sessionId]['ch']==3 && servicio.length>0)
              {
                if(servicio.find(findSMoIn))                                
                  var ss = 'Movi In'; //servicio                                    
                else if(servicio.find(findSMoOut))                                
                  var ss = 'Movi Out'; //servicio                                    
                else if(servicio.find(findSLiv))                                
                  var ss = 'Liverpool'; //servicio                                    
                else if(servicio.find(findSATT))                                
                  var ss = 'AT&T';                                
                else if(servicio.find(findSSRE))                                
                  var ss = 'SRE';
                                                                
                if(turno.find(findTMat))                                
                  var tt = 'Matutino'; //turno                                   
                else if(turno.find(findTVes))                                
                  var tt = 'Vespertino'; //turno    

                var sal = bsalario(xl,ss,tt);

                if (connectedUserData[sessionId]['rep']==1)
                {
                  delete context.missingIntent;
                  // console.log('3');
                  context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                  connectedUserData[sessionId]['sendChat'] = true;
                  atiende(connectedUserData[sessionId]['usuario']);
                }

                else if (sal==undefined && !(connectedUserData[sessionId]['rep']==1))
                {
                  context.forecast = '¿Me podría reformular su petición de campaña y turno?';
                  connectedUserData[sessionId]['rep'] =1;
                }

                else
                {
                  context.forecast = 'Para la campaña ' + ss + ' en el turno ' + tt + sal + ' ¿Te interesa?';
                  connectedUserData[sessionId]['ch'] =2;
                }
              }

              else if (salario.length>0 && !(servicio.length>0) && !(connectedUserData[sessionId]['ch']==2))
              {
                context.forecast = 'Con gusto te compartimos el salario, ¿De cual vacante y campaña te interesa?';
                connectedUserData[sessionId]['ch'] =3;                  
              }

              else if (servicio.length>0 || connectedUserData[sessionId]['ch']==2 && continua.find(findContiPos))
              {
                if (nohola>40)
                {
                  if (connectedUserData[sessionId]['sendChat'] == true)
                  {
                    delete context.missingIntent;
                    context.forecast = ' ';        
                    atiende(connectedUserData[sessionId]['usuario']);
                  }

                  else
                  {
                    delete context.missingIntent;
                    // console.log('4');
                    context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                    connectedUserData[sessionId]['sendChat'] = true;
                    atiende(connectedUserData[sessionId]['usuario']);
                  }  
                }
                else
                {
                  context.forecast = 'Excelente, ¿Has trabajado anteriormente en Pentafon?';
                  connectedUserData[sessionId]['pg'] =1;
                  connectedUserData[sessionId]['ch'] =0;
                }
              }

              else 
              {
                if (connectedUserData[sessionId]['sendChat'] == true)
                {
                  delete context.missingIntent;
                  context.forecast = ' ';        
                  atiende(connectedUserData[sessionId]['usuario']);
                }

                else
                {
                  // console.log('5');
                  delete context.missingIntent;
                  context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                  connectedUserData[sessionId]['sendChat'] = true;
                  atiende(connectedUserData[sessionId]['usuario']);
                }                        
              }
            }

            else
            {
              if (connectedUserData[sessionId]['sendChat'] == true)
              {
                delete context.missingIntent;
                context.forecast = ' ';        
                atiende(connectedUserData[sessionId]['usuario']);
              }

              else
              {
                // console.log('55');
                delete context.missingIntent;
                context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                connectedUserData[sessionId]['sendChat'] = true;
                atiende(connectedUserData[sessionId]['usuario']);
              }              
            }                        
          }

          /////THANKS
          else if ((gracias.length>0) && !(intent.length>0) && !(connectedUserData[sessionId]['ff']===1) && !(espera.length>0) ) 
          {    
            if (nohola > 25) 
            {
              if (connectedUserData[sessionId]['sendChat'] == true)
              {
                delete context.missingIntent;
                context.forecast = ' ';        
                atiende(connectedUserData[sessionId]['usuario']);
              }

              else
              {
                // console.log('6');
                delete context.missingIntent;
                context.forecast = 'Permítame un momento por favor, le comunico con el Especialista para que revise su situación...';        
                connectedUserData[sessionId]['sendChat'] = true;
                atiende(connectedUserData[sessionId]['usuario']);
              }               
            }

            else
            {
                var thankyou = ['Es nuestro placer!', 'Por nada, estamos para servirle!', 'Es un gusto!'];
                var rand = thankyou[Math.floor(Math.random() * thankyou.length)];
                context.forecast = rand;
                delete context.missingIntent;
            }              
          }
                    
          /////OK
          else if ((ok.length>0) && !(intent.length>0) && !(gracias.length>0) && !(hola.length>0) && !(connectedUserData[sessionId]['a2']) && !(espera.length>0)) 
          {    
            if (nohola > 25) 
            {
              if (connectedUserData[sessionId]['sendChat'] == true)
              {
                delete context.missingIntent;
                context.forecast = ' ';        
                atiende(connectedUserData[sessionId]['usuario']);
              }

              else
              {
                // console.log('7');
                delete context.missingIntent;
                context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                connectedUserData[sessionId]['sendChat'] = true;
                atiende(connectedUserData[sessionId]['usuario']);
              }
            }
            else
            {
              var oki = ['Ok! ¿Tiene alguna otra duda que le pueda resolver ' + connectedUser1 + ' ?','Perfecto. ¿Tiene alguna otra duda que le pueda resolver  ' + connectedUser1 + '?'];
              var okay = oki[Math.floor(Math.random() * oki.length)];
              context.forecast = okay;
              connectedUserData[sessionId]['ff']=1;
              delete context.missingIntent;
            }
               
          }

          /////SACAR
          else if ((!(intent.length>0) && connectedUserData[sessionId]['ff']===1 && continua.length>0 || !(intent.length>0) && connectedUserData[sessionId]['ff']===1 && gracias.length>0) && !(espera.length>0)) 
          {                                 
            if (continua.find(findContiNeg) && !(nohola > 33)) 
            {
              if (connectedUserData[sessionId]['sendChat'] == true)
              {
                delete context.missingIntent;
                context.forecast = ' ';        
                atiende(connectedUserData[sessionId]['usuario']);
              }

              else
              {
                delete context.missingIntent;
                // console.log('8');
                context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                connectedUserData[sessionId]['sendChat'] = true;
                atiende(connectedUserData[sessionId]['usuario']);
              }
            }
                        
            else if (gracias.length>0 || continua.find(findContiPos)) 
            {
              if (nohola > 25) 
              {
                if (connectedUserData[sessionId]['sendChat'] == true)
                {
                  delete context.missingIntent;
                  context.forecast = ' ';        
                  atiende(connectedUserData[sessionId]['usuario']);
                }

                else
                {
                  delete context.missingIntent;
                  context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                  connectedUserData[sessionId]['sendChat'] = true;
                  atiende(connectedUserData[sessionId]['usuario']);
                }
              }
              else if (continua.length>0)
              {
                context.forecast = 'Muchas gracias.';
                delete context.missingIntent;
              }
              else
              {
                var thankyou = ['Es nuestro placer!', 'Por nada, estamos para servirle!', 'Es un gusto!'];
                var rand = thankyou[Math.floor(Math.random() * thankyou.length)];
                context.forecast = rand;
                delete context.missingIntent;
              }  
            }

            else
            {
              if (connectedUserData[sessionId]['sendChat'] == true)
              {
                delete context.missingIntent;
                context.forecast = ' ';        
                atiende(connectedUserData[sessionId]['usuario']);
              }

              else
              {
                // console.log('10');
                delete context.missingIntent;
                context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                connectedUserData[sessionId]['sendChat'] = true;
                atiende(connectedUserData[sessionId]['usuario']);
              }
            }                        
          }
                    
          else
          {            
            connectedUserData[sessionId]['unknownIntentCount']= connectedUserData[sessionId]['unknownIntentCount'] + 1;
            //mandar para deeplearning

            if (connectedUserData[sessionId]['unknownIntentCount'] > 2) 
            {
              if (connectedUserData[sessionId]['sendChat'] == true)
              {
                delete context.missingIntent;
                context.forecast = ' ';        
                atiende(connectedUserData[sessionId]['usuario']);
              }

              else
              {
                // console.log('11');
                delete context.missingIntent;
                context.forecast = 'Permítame un momento ' + connectedUser1 + ', ahorita te respondemos.';        
                connectedUserData[sessionId]['sendChat'] = true;
                atiende(connectedUserData[sessionId]['usuario']);
              }
            }
            else
            {
              var sorry = ['Lo lamento, pero no entendí su comentario. ¿Me lo puede repetir con mas detalle?','Lo siento, pero no entendí su comentario. ¿Me lo puediera reformular?', 'Le pido una disculpa, pero no entendí. ¿Me pudiera reformular su comentario?'];
              var rands = sorry[Math.floor(Math.random() * sorry.length)];
              context.forecast = rands;
            }       
          }
 
          //intents

          function findChamba(x) 
          {
            return x.value === 'chamba';
          }

          function findTVes(x) 
          {
            return x.value === 'Vespertino';
          }                
                    
          function findTMat(x) 
          {
            return x.value === 'Matutino';
          }

          function findTFinde(x) 
          {
            return x.value === 'fin de semana';
          }                
                    
          function findMorelia(x) 
          {
            return x.value === 'morelia';
          }

          function findSMoIn(x) 
          {
            return x.value === 'Movi In';
          }

          function findSMoOut(x) 
          {
            return x.value === 'Movi Out';
          }                

          function findSLiv(x) 
          {
            return x.value === 'Liverpool';
          }

          function findSATT(x) 
          {
            return x.value === 'AT&T';
          }

          function findSSRE(x) 
          {
            return x.value === 'SRE';
          }  

          function findNoEstudio(x) 
          {
            return x.value === 'no estudie';
          }  

          function findPrepa(x) 
          {
            return x.value === 'tengo prepa';
          }                
                    
          function findContiPos(x) 
          {
            return x.value === 'si';
          }
                     
          function findContiNeg(x) 
          {
            return x.value === 'no';
          }

          function findPerDiario(x) 
          {
            return x.value === 'diario';
          }

          function findPerMensual(x) 
          {
            return x.value === 'mensual';
          }

          function findThoras(x) 
          {
            return x.value === 'hora';
          }

          function findTmin(x) 
          {
            return x.value === 'min';
          }

          function findTipoSuperv(x) 
          {
            return x.value === 'supervisor';                        
          }

          function findMiscPrestaciones(x) 
          {
            return x.value === 'prestaciones';
          }

          function findMiscHorarios(x) 
          {
            return x.value === 'horarios';
          }
          
          step();
        });
        
        ///FIN WIT.messsage
              
      },
        
      function sendFB(step)
      {
        ////////////////////////FIN WIT . INICIO SEND
          
        const recipientId = sessions[sessionId]['fbid'];

        if(context.forecast== 'davacantes')
        {
          var vac = bvacantes(xl);
          var vacantes = [];

          vacantesWS(function(listaVacantes){
            vacantes = listaVacantes;
          });
          var connectedUser = connectedUserData[sessionId]["usuario"];
          var connectedUser1 = connectedUser.charAt(0).toUpperCase() + connectedUser.slice(1);
          var context1 = 'Gracias por tu interés en ser parte del equipo, ' + connectedUser1 + '. Hoy contamos con las siguientes vacantes:'; 
          var contextn = ' ¿Te interesa alguna?';

          async2.series([
            function ichi(stp)
            {
              FB.fbMessage(recipientId, context1, (err, data) => {

                if (err)
                  console.log('Oops! An error occurred while forwarding the response to', recipientId, ':', err);

                stp();
              });
            },

            function ni(stp)
            {
              for (var i = 0; i < vacantes.length; i++) 
              {              
                FB.fbMessage(recipientId, vacantes[i].nombre + " " + vacantes[i].horario, (err, data) => {

                  if (err)
                    console.log('Oops! An error occurred while forwarding the response to', recipientId, ':', err);
                });
              }

              stp(); 
            },
        
            function san(stp)
            {
              setTimeout(function()
              {
                stp();
              },1000)
            },  

            function yon(stp)
            {
              FB.fbMessage(recipientId, contextn, (err, data) => {

                if (err) 
                  console.log('Oops! An error occurred while forwarding the response to', recipientId, ':', err);
                
                step();
              });
            } 
          ])
        }

        else
        {
          FB.fbMessage(recipientId, context.forecast, (err, data) => {

            if (err) 
              console.log('Oops! An error occurred while forwarding the response to', recipientId, ':', err);
            step();
          });
        }

        /////////////////////////FIN SEND          
      }
    ])
  }

  res.sendStatus(200);
});

const Wit = require('./lib/wit');

function generateWitClient(socket)
{
  const accessToken = (() => {  
        
        return 'VLWAM7XRBNNHIFWRBMHGQ3MNRA3XWSUG';
    })();

    const client = new Wit({accessToken});

    //const interactive = require('./lib/interactive');
    //interactive(client);
    
    return client;
}


  