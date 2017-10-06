var $ = require("jquery");

$(function() {
  "use strict";

  var pastebinmixin = require("./pastebin_mixin_pb.js");
  var container = require("./container_pb.js");
  var pako = require("pako");
  var base64js = require('base64-js');

  $("#publish").click(function() {
    console.log($("#text").val());


    // Encode

    var message = new pastebinmixin.PastebinMixin();
    message.setText($("#text").val());
    var mixinPayload = message.serializeBinary();
    console.log(mixinPayload);

    var mixinMessage = new container.Mixin();
    mixinMessage.setMixinId(1);
    mixinMessage.setPayload(mixinPayload);

    var itemMessage = new container.Item();
    itemMessage.setMixinsList([mixinMessage]);

    var itemPayload = itemMessage.serializeBinary();
    console.log(itemPayload);
    
    var itemPayloadCompressed = pako.deflateRaw(itemPayload);
    console.log(itemPayloadCompressed);

    var containerMessage = new container.ItemContainer();
    containerMessage.setCompression = container.Compression.DEFLATE;
    containerMessage.setPayload(itemPayloadCompressed);

    var containerPayload = containerMessage.serializeBinary();
    console.log(containerPayload);

    var data = '--4na9stc9e6a\nContent-Disposition: file; filename=""\nContent-Type: application/octet-stream\n\n' + Buffer.from(containerPayload).toString('binary'); + '\n--4na9stc9e6a--';
    
    console.log(data);

    $.ajax({
      url: "http://127.0.0.1:5001/api/v0/add",
      method: "POST",
      data: data,
      cache: false,
      processData: false, // Don't process the files
      contentType: 'multipart/form-data; boundary=4na9stc9e6a',
      mimeType: "application/json",
      dataType: "json"
    })
      .done(function(result) {
        var hash = result.Hash;
        
        console.log(hash);

    // Decode

      $.ajax({
        url: "http://127.0.0.1:5001/api/v0/cat?arg=/ipfs/" + hash,
        method: "GET",
      })
        .done(function(result) {
        
          console.log(result);
          console.log(result.length);
          
          var containerPayload2 = new Uint8Array(Buffer.from(result, "binary"));
          console.log(containerPayload2);
        
          var containerMessage2 = container.ItemContainer.deserializeBinary(containerPayload2);
          var itemPayloadCompressed2 = containerMessage2.getPayload();
          console.log(itemPayloadCompressed2);

          var itemMessage2 = container.Item.deserializeBinary(pako.inflateRaw(itemPayloadCompressed2));
          var mixins = itemMessage2.getMixinsList();
          
          var mixinPayload2 = mixins[0].getPayload();
          console.log(mixinPayload2);
          
          var pastbinMixinMessage2 = pastebinmixin.PastebinMixin.deserializeBinary(mixinPayload2);
          
          console.log(pastbinMixinMessage2.getText());
        });
      });
  });

});
