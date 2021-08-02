// Configuración de la zona horaria
var timeZone = "America/Argentina/Buenos_Aires";
var dateFormat = "dd/MM/yyyy";
var dateTimeFormat = "HH:mm:ss";

// Variable de retorno de datos
var returnData = "";

// Emails de administrador a quien se enviaran los correos
var emailAddressAdmin =
[
  "sc@defymotion.com.ar"
];

// Enumeraciones para los payload devueltos
var ERROR_UNDEFINED = 0;
var ERROR_UNSUPPORTED_PARAMETER = 1;
var ERROR_UNSUPPORTED_OPERATION = 2;
var ERROR_EMPY_DATA = 3;
var ERROR_USER_REGISTER = 4;

// ID del documento donde se cargaran los registros
var sheetLogID = "1b-klqBIqHrq0kIzdpJkqarpVRVMSzc07d8NY7e-cNBM";

// Función para enviar emails
function sendEmails(email, issue, message)
{
  for (var i = 0 ; i < email.length ; i++)
  {
    MailApp.sendEmail(email[i], issue, message);
  }
}

// Funcion que capta los parámetros via GET
function doGet()
{
  // Resultado
  returnData = "";

  // Mensaje
  addReturnData("ERROR=" + String(ERROR_UNSUPPORTED_OPERATION));

  // Se devuelve el resultado
  return ContentService.createTextOutput(returnData);
}

// Funcion que capta los parámetros POST
function doPost(request)
{
  // Resultado
  returnData = "";

  // Si se recibio algo
  if(typeof request !== "undefined")
  {
    // Indica si la operacion es valida
    var validUser = false;

    // Variables de usuario
    var userUid = "";
    var userName = "";
    var userState = "";

    // Se rescatan todos parametros incluido en la URL
    for (var param in request.parameter)
    {
      // Se establece en falso para la verificación
      validUser = false;

      // Se elimina los caracteres molestos
      var value = stripQuotes(request.parameter[param]);

      // Se ejecuta la acción según el parámetro
      switch (param)
      {
        // ID de la tarjeta
        case "uid":
          userUid = value;

          validUser = true;

          break;

        // No se coincide con ningun parametro
        default:
          addReturnData("ERROR=" + String(ERROR_UNSUPPORTED_PARAMETER));

          break;
      }

      // Si algún parámetro no es válido no se registra el usuario
      if (!validUser)
      {
        addReturnData("ERROR=" + String(ERROR_USER_REGISTER));

        break;
      }

      else
      {
        // Se abre el documento actual (el que contiene información de los usuarios de las tarjetas)
        var sheetUserInfo = SpreadsheetApp.getActive().getActiveSheet();
        // Se abre el documento de destino (en donde se guardará los registros de ingreso)
        var sheetLog = SpreadsheetApp.openById(sheetLogID);

        // Se extrae los datos de las personas registradas
        var data = sheetUserInfo.getDataRange().getValues();

        // Se verifica quien realizo la acción
        var newUser = true;

        for (var i = 0 ; i < sheetUserInfo.getLastRow() ; i++)
        {
          // Si algun UID coincide
          if (userUid == data[i][1])
          {
            // No es un nuevo usuario
            newUser = false;

            // Se obtiene el nombre
            userName = data[i][0];
            
            // Se obtiene el estado
            if (data[i][2] == "ENTRADA")
            {
              userState = "SALIDA";
            }

            else if (data[i][2] == "SALIDA")
            {
              userState = "ENTRADA";
            }

            // Se modifica el estado actual
            userChangeState(sheetUserInfo, i, userName, userUid, userState);
          }
        }

        // Si el usuario es nuevo
        if (newUser)
        {
          // Valores por defecto
          userName = "Nuevo";
          userState = "ENTRADA";

          addNewUser(sheetUserInfo, userUid, userName, userState);

          sendEmails(emailAddressAdmin, "Usuario nuevo registrado", "Un nuevo usuario accedio con UID " + userUid);
        }

        else
        {
          
        }

        addReturnData("UID=" + userUid + "&USER=" + userName + "&STATE=" + userState + "&TIME=" + Utilities.formatDate(new Date(), timeZone, dateTimeFormat));

        // Se añade el registro a la hoja de calculo
        addLog(sheetLog, userUid, userName, userState);

        break;
      }
    }
  }

  // Si no se recibio algo
  else
  {
    addReturnData("ERROR=" + String(ERROR_EMPY_DATA));
  }

  // Se devuelve el resultado
  return ContentService.createTextOutput(returnData);
}

// Funcion que escribe en el sheet
function addLog(sheet, userUid, userName, userState)
{
  // Se obtiene la fecha actual
  var fecha = new Date();

  // Se asocia el numero de mes a letras
  var mes = Number(Utilities.formatDate(fecha, timeZone, "MM"));

  switch (mes)
  {
    case 1:
      mes = "Enero";
      break;

    case 2:
      mes = "Febrero";
      break;

    case 3:
      mes = "Marzo";
      break;

    case 4:
      mes = "Abril";
      break;

    case 5:
      mes = "Mayo";
      break;

    case 6:
      mes = "Junio";
      break;

    case 7:
      mes = "Julio";
      break;

    case 8:
      mes = "Agosto";
      break;

    case 9:
      mes = "Septiembre";
      break;

    case 10:
      mes = "Octubre";
      break;

    case 11:
      mes = "Noviembre";
      break;

    case 12:
      mes = "Diciembre";
      break;

    default:
      mes = "Indefinido"
      break;
  }

  // Se obtiene la hoja correspondiente al mes
  var logSheet = sheet.getSheetByName(mes);

  // Posicion del final
  var position;

  // Rango de filas y columnas
  var newRange;

  // Si la hora del mes no existe
  if (logSheet == null)
  {
    // Se inserta la nueva hoja
    logSheet = sheet.insertSheet(mes);

    // Aplicamos formato de texto plano a toda la hoja
    newRange = logSheet.getRange(1, 1, logSheet.getMaxRows(), logSheet.getMaxColumns());

    newRange.setNumberFormat("@");

    // Posicion para agregar el encabezado
    position = logSheet.getLastRow() + 1;

    var headerData = [];

    headerData[0] = "Fecha";
    headerData[1] = "Hora";
    headerData[2] = "UID";
    headerData[3] = "Persona";
    headerData[4] = "Estado";

    // Rango de filas y columnas
    newRange = logSheet.getRange(position, 1, 1, headerData.length);

    newRange.setFontWeight("bold");

    // Se añade el valor de la fila
    newRange.setValues([headerData]);
  }

  // Posición última para añadir datos
  position = logSheet.getLastRow() + 1;

  // Nueva fila que será añadida al final
  var rowData = [];

  // Datos de la fila nueva
  rowData[0] = Utilities.formatDate(fecha, timeZone, dateFormat);
  rowData[1] = Utilities.formatDate(fecha, timeZone, dateTimeFormat);
  rowData[2] = userUid;
  rowData[3] = userName;
  rowData[4] = userState;

  // Rango de filas y columnas
  newRange = logSheet.getRange(position, 1, 1, rowData.length);

  // Se añade el valor de la fila
  newRange.setValues([rowData]);
}

// Funcion que añade un usuario nuevo
function addNewUser(sheet, userUid, userName, userState)
{
  // Posición última para añadir datos
  var position = sheet.getLastRow() + 1;

  // Nueva fila que será añadida al final
  var rowData = [];

  // Datos de la fila nueva
  rowData[0] = userName;
  rowData[1] = userUid;
  rowData[2] = userState;

  // Rango de filas y columnas
  var newRange = sheet.getRange(position, 1, 1, rowData.length);

  // Se añade el valor de la fila
  newRange.setValues([rowData]);
}

// Funcion como que modifica el estado actual del usuario
function userChangeState(sheet, index, name, uid, newState)
{
  // Posición del UID correspondiente
  var position = index + 1;

  // Nueva fila que será añadida al final
  var rowData = [];

  // Datos de la fila nueva
  rowData[0] = name;
  rowData[1] = uid;
  rowData[2] = newState;

  // Rango de filas y columnas
  var newRange = sheet.getRange(position, 1, 1, rowData.length);

  // Se añade el valor de la fila
  newRange.setValues([rowData]);
}

// Funcion que añade devoluciones para debug
function addReturnDataWithDebug(addData)
{
  returnData += addData + "\r\n";
}

// Funcion que añade devoluciones
function addReturnData(addData)
{
  returnData += addData;
}

// Funcion que elimina los caracteres molestos
function stripQuotes(value)
{
  value = value.replace('\r', "");
  value = value.replace('\n', "");
  return value.replace(/^["']|['"]$/g, "");
}

/*************************************** Funciones de pueba ***************************************/
// Prueba para addLog
function addLogTest()
{
  addLog(SpreadsheetApp.openById(sheetLogID), "0000", "Gabi", "ENTRADA");
}
/**************************************************************************************************/

