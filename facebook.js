'use strict';

var soap = require('soap');
const request = require('request');
const Config = require('./const.js');

var url = 'http://appext.pentafon.com/RhService/Service1.svc?wsdl';

var args = {};

const fbReq = request.defaults({
  uri: 'https://graph.facebook.com/me/messages',
  method: 'POST',
  json: true,
  qs: {
    access_token: Config.FB_PAGE_TOKEN
  },
  headers: {
    'Content-Type': 'application/json'
  },
});


const fbMessage = (recipientId, msg, cb) => {
 
  var domingo = false;
  var sabado = false;

  function formatDatem(date) 
  {

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

  var mañana = formatDatem(new Date());
  var mañananum = mañana.match(/\d+/)[0];
  mañananum = Number(mañananum);
  var mañanamon = mañana.replace(/[0-9]/g, '');
  var mañanamonth = mañanamon.replace(/\s/g, "");
  var pasado = formatDatepp(mañananum,mañanamonth);


  if (msg == 'Gracias, nos gustaría agendar una cita contigo en Pentafon, ¿Cual de estos horarios te conviene?' || msg == 'Excelente! Nos gustaría agendar una cita contigo en Pentafon, ¿Cual de estos horarios te conviene?' )
  {
    var gruposList = [];
    
    soap.createClient(url, function(err, client) 
    {
      if(err != "null")
      {
        client.GetGrupos(args, function(err, result) 
        {  
            if(err != "null")
            {
              var response = result.GetGruposResult.tbl_GruposReclutamiento;
                
              try
              {
                function agrega(item, counter, array)
                {
                  if(item.Estatus == "true")
                  {
                    var grupo = {content_type: "text", title: "", payload: ""};
                    grupo.payload = item.GrupoId;

                    let fecha = item.FechaInicio.substring(0, 10);
                    let hora = item.HoraInicio.substring(2);
                    grupo.title = fecha + " " + hora;
                    gruposList.push(grupo);
                  }
                }

                response.forEach(agrega);
                var opts = {form: {recipient: {id: recipientId}, message: {text: msg, quick_replies: gruposList}}};
            
                fbReq(opts, (err, resp, data) => {
                  if (cb) 
                    cb(err || data.error && data.error.message, data);
                });
              }
              catch(err)
              {
                console.log("Error al obtener la informacion: " + err)
              }
            }            
        });
      }
      else
          console.log("No se pudo crear el cliente para GetTiemporTrayecto: " + err);
    });
  }

  else if (msg == '¿Cuanto tiempo harás de tu casa o de un destino previo a Pentafon (Laguna del Mayran 258, Colonia Anahuac, 11320, Del. Miguel Hidalgo)?' || msg == '¿Cuanto tiempo harás de tu casa a Pentafon (Laguna del Mayran 258, Colonia Anahuac, 11320, Del. Miguel Hidalgo)?')
  {
    var tiempoTrayectoList = [];
    
    soap.createClient(url, function(err, client) 
    {
      if(err != "null")
      {
        client.GetTiemposTrayecto(args, function(err, result) 
        {  
            if(err != "null")
            {
                var response = result.GetTiemposTrayectoResult.cat_TiempoTrayecto;
                
                try
                {
                    function agrega(item, counter, array)
                    {
                      if(item.Activo == "true")
                      {
                        var tiempoTrayecto = {content_type: "text", title: "", payload: ""};

                        tiempoTrayecto.payload = item.Id;
                        tiempoTrayecto.title = item.TiempoTrayecto;
  
                        tiempoTrayectoList.push(tiempoTrayecto);
                      }
                    }

                    response.forEach(agrega);

                    var opts = {form: {recipient: {id: recipientId}, message: {text: msg, quick_replies: tiempoTrayectoList}}};
                
                    fbReq(opts, (err, resp, data) => {
                      if (cb) 
                        cb(err || data.error && data.error.message, data);
                    });
                }
                catch(err)
                {
                    console.log("Error al obtener la informacion: " + err)
                }
            }            
        });
      }
      else
          console.log("No se pudo crear el cliente para GetTiemporTrayecto: " + err);
    });

  }

  else if (msg == '¿Has trabajado anteriormente en Pentafon?' || msg == 'Excelente! ¿Has trabajado anteriormente en Pentafon?')
  {
    const opts = 
    {
      form:
      {
        recipient: 
          {
            id: recipientId,
          },
        message: 
        {
          text: msg,
          quick_replies:[
            {
              "content_type":"text",
              "title": 'Si 😎',
              "payload":"red"
            },
            {
              content_type:"text",
              title: 'Aún no 😉',
              payload:"green"
            },
          ]
        }
      },
    };

    fbReq(opts, (err, resp, data) => {
      if (cb) {
        cb(err || data.error && data.error.message, data);
      }
    });

  }

  else if (msg == 'Excelente! ¿Cúal es tu grado máximo de estudios?' || msg == 'Gracias, ¿Cúal es tu grado máximo de estudios?')
  {
    var nivelEstudioList = [];
    
    soap.createClient(url, function(err, client) 
    {
      if(err != "null")
      {
        client.GetNivelEstudios(args, function(err, result) 
        {  
            if(err != "null")
            {
                var response = result.GetNivelEstudiosResult.cat_NivelEstudios;
                
                try
                {
                    function agrega(item, counter, array)
                    {
                      if(item.Activo == "true")
                      {
                        var nivelEstudios = {content_type: "text", title: "", payload: ""};

                        nivelEstudios.payload = item.Id;

                        switch(item.Id)
                        {
                          case "2":
                            nivelEstudios.title = 'PREPA ANTES 4°SEM';
                            break;
                          
                          case "3":
                            nivelEstudios.title = 'PREPA MAYOR A 4°SEM';
                            break;

                          case "4":
                            nivelEstudios.title = 'PREPA CONCLUIDA';
                            break;

                          case "5":
                            nivelEstudios.title = 'LICENCIATURA TRUNCA';
                            break;
                          
                          case "6":
                            nivelEstudios.title = 'LICENCIATURA CONCLUIDA';
                            break;

                          default:
                            nivelEstudios.title = item.NivelEstudio;
                        }
                        
  
                        nivelEstudioList.push(nivelEstudios);
                      }
                    }

                    response.forEach(agrega);

                    var opts = {form: {recipient: {id: recipientId}, message: {text: msg, quick_replies: nivelEstudioList}}};
                
                    fbReq(opts, (err, resp, data) => {
                      if (cb) 
                        cb(err || data.error && data.error.message, data);
                    });
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
  }


  else 
  {
    const opts = 
      {
      form:
      {
        recipient: 
          {
          id: recipientId,
          },
        message: 
          {
          text: msg,
          },
        },
      };

    fbReq(opts, (err, resp, data) => {
      if (cb) {
        cb(err || data.error && data.error.message, data);
      }
    });

  } 


  
};



const fbTyping = (recipientId, cb) => {
 const opts = 
  {
    form:
    {
      recipient: 
      {
      id: recipientId,
      },
      sender_action: "typing_on"
    },
  };

  fbReq(opts, (err, resp, data) => {
    if (cb) {
      cb(err || data.error && data.error.message, data);
    }
  });
};



// See the Webhook reference
// https://developers.facebook.com/docs/messenger-platform/webhook-reference
const getFirstMessagingEntry = (body) => {
  const val = body.object === 'page' &&
    body.entry &&
    Array.isArray(body.entry) &&
    body.entry.length > 0 &&
    body.entry[0] &&
    body.entry[0].messaging &&
    Array.isArray(body.entry[0].messaging) &&
    body.entry[0].messaging.length > 0 &&
    body.entry[0].messaging[0];
  return val || null;
};


module.exports = {
  getFirstMessagingEntry: getFirstMessagingEntry,
  fbMessage: fbMessage,
  fbReq: fbReq,
  fbTyping: fbTyping
};