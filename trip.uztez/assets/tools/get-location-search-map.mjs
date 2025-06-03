
export default () => JSON.parse("{\"" + ((location.search || '?').substring(1).replace(/(\=)|(\&)|(\/\?)/g, function (k) {
  var rtn = k;
  if (k == "\=") rtn = "\"\:\"";
  else if ((k == "\&") /*|| (k == "\/\?")*/) rtn = "\",\"";
  return rtn;
}) + "\"}"));