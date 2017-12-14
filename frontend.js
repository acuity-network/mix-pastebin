var $ = require("jquery");

$(function() {
  "use strict";

  const mixinmixin = require("./protobuf/mixin-mixin_pb.js");
  const container = require("./protobuf/container_pb.js");
  const pako = require("pako");
  const base64js = require('base64-js');
  const multihash = require('multihashes');
  const Web3 = require('web3');
  var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8645"));

  const itemStoreIpfsSha256Abi = require('./mix-item-store/item_store_ipfs_sha256.abi.json');
  const itemStoreIpfsSha256Factory = web3.eth.contract(itemStoreIpfsSha256Abi);
  const itemStore = itemStoreIpfsSha256Factory.at("0xab4aa658083cd937c40a369cbd2c81ef3939999f");


  $("#publish").click(function() {
    console.log($("#text").val());


    // Encode

    var message = new mixinmixin.MixinMixin();
    message.setSchema($("#text").val());
    var mixinPayload = message.serializeBinary();
    console.log(mixinPayload);

    var mixinMessage = new container.Mixin();
    mixinMessage.setMixinId(0);
    mixinMessage.setPayload(mixinPayload);

    var itemMessage = new container.Item();
    itemMessage.setMixinsList([mixinMessage]);

    var itemPayload = itemMessage.serializeBinary();
    console.log(itemPayload);
    
    var itemPayloadCompressed = pako.deflateRaw(itemPayload);
    console.log(itemPayloadCompressed);

    var containerMessage = new container.ItemContainer();
    containerMessage.setCompression(container.Compression.DEFLATE);
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
        
        var decodedHash = multihash.decode(multihash.fromB58String(hash));
        
        console.log(decodedHash);
        
        if (decodedHash.name != "sha2-256") {
          throw "Wrong type of multihash.";
        }
        
        var hashHex = "0x" + decodedHash.digest.toString("hex");
        
        console.log(hashHex);
        
        var flagsNonce = "0x01" + web3.sha3(Math.random().toString()).substr(4);
        
        console.log(flagsNonce);
        
        var account = "0xe58b128142a5e94b169396dd021f5f02fa38b3b0";
        web3.eth.defaultAccount = account;
        
        var itemId = itemStore.getNewItemId(flagsNonce);

        $("#output").html("<code>" + itemId + "</code>");

        console.log(itemId);
        
        itemStore.create(flagsNonce, hashHex, {gas: 1000000});

        // Decode

        var retreievedIpfsHash = itemStore.getRevisionIpfsHash(itemId, 0, {}, "pending");

        console.log(retreievedIpfsHash);

        var encodedIpfsHash = multihash.toB58String(multihash.encode(Buffer.from(retreievedIpfsHash.substr(2), "hex"), 'sha2-256'));

        console.log(encodedIpfsHash);
        
        $.ajax({
          url: "http://127.0.0.1:5001/api/v0/cat?arg=/ipfs/" + encodedIpfsHash,
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
            
            var pastbinMixinMessage2 = mixinmixin.MixinMixin.deserializeBinary(mixinPayload2);
            
            console.log(pastbinMixinMessage2.getSchema());
          });
      });
  });
});
