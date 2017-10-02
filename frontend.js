var $ = require("jquery");
var pastebinmixin = require("./pastebin_mixin_pb.js");
var container = require("./container_pb.js");

$(function() {
  "use strict";

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
    
    var containerMessage = new container.ItemContainer();
    containerMessage.setCompression = container.Compression.NONE;
    containerMessage.setPayload(itemPayload);
    
    var containerPayload = containerMessage.serializeBinary();
    console.log(containerPayload);


    // Decode
    
    var containerMessage2 = container.ItemContainer.deserializeBinary(containerPayload);
    var itemPayload2 =  containerMessage2.getPayload();
    console.log(itemPayload2);

    var itemMessage2 = container.Item.deserializeBinary(itemPayload2);
    var mixins = itemMessage2.getMixinsList();
    
    var mixinPayload2 = mixins[0].getPayload();
    console.log(mixinPayload2);
    
    var pastbinMixinMessage2 = pastebinmixin.PastebinMixin.deserializeBinary(mixinPayload2);
    
    console.log(pastbinMixinMessage2.getText());
    
  });
});
