curl http://localhost:8983/solr/admin/collections?action=CREATE&name=rts&numShards=1&replicationFactor=2
curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field":{
     "name":"address",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"agency",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"email",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"firstName",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"itemId",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"itemName",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"itemOrder",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"items",
     "type":"strings",
     "stored":true },
   "add-field":{
     "name":"lastName",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"meetingDate",
     "type":"date",
     "stored":true },
   "add-field":{
     "name":"meetingId",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"meetingName",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"notes",
     "type":"text_general",
     "stored":true },
   "add-field":{
     "name":"offAgenda",
     "type":"boolean",
     "stored":true },
   "add-field":{
     "name":"official",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"phone",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"sireId",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"stance",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"status",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"subTopic",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"timeSubmitted",
     "type":"date",
     "stored":true },
   "add-field":{
     "name":"timeToSpeak",
     "type":"string",
     "stored":true },
   "add-field":{
     "name":"type",
     "type":"string",
     "stored":true }
}' http://localhost:8983/solr/gettingstarted/schema
