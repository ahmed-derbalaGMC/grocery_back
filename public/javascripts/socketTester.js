$(function () {
    var counter = 0; //counter of incoming
    var counter2 = 0; //counter of incoming


    var socket; //= io($("#server").val());

    //a($("#server").val());

    function a(s) {
        socket = io(s, { query: { token: $("#token").val() } }); //socket.connect();
        // socket = io(s); //socket.connect();

        socket.on('connect', () => {
            $("#logs").prepend("<p class='message'>" + (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds()) + ':' + (new Date().getMilliseconds()) + ' connect | ' + "</p>")
            $("#socketStatus").html("connect")
            $("#socketId").val(socket.id);


        });
        socket.on('disconnect', (reason) => {
            $("#logs").prepend("<p class='message'>" + (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds()) + ':' + (new Date().getMilliseconds()) + ' disconnect | ' + reason + "</p>")
            $("#socketId").val("")
            $("#socketStatus").html("disconnect " + reason)
        })
        socket.on('reconnect_attempt', (attemptNumber) => {
            $("#logs").prepend("<p class='message'>" + (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds()) + ':' + (new Date().getMilliseconds()) + ' reconnect_attempt | ' + attemptNumber + "</p>")
            $("#socketId").val("")
            $("#socketStatus").html("reconnect_attempt " + attemptNumber)
        });
        socket.on('reconnect', (attemptNumber) => {
            $("#logs").prepend("<p class='message'>" + (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds()) + ':' + (new Date().getMilliseconds()) + ' reconnect | ' + attemptNumber + "</p>")

            $("#socketStatus").html("reconnect " + attemptNumber)
            $("#socketId").val(socket.id)
        });
        socket.on('reconnecting', (attemptNumber) => {
            $("#logs").prepend("<p class='message'>" + (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds()) + ':' + (new Date().getMilliseconds()) + ' reconnecting | ' + attemptNumber + "</p>")
            $("#socketId").val("")
            $("#socketStatus").html("reconnecting " + attemptNumber)
        });
        socket.on('reconnect_failed', () => {
            $("#logs").prepend("<p class='message'>" + (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds()) + ':' + (new Date().getMilliseconds()) + ' reconnect_failed | ' + "</p>")
            $("#socketId").val("")
            $("#socketStatus").html("reconnect_failed ")
        });
        /*socket.on('ping', () => {
            $("#logs").prepend("<p class='message'>" + (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds()) + ':' + (new Date().getMilliseconds()) + ' ping | ' + "</p>")
        });
        socket.on('pong', (latency) => {
            $("#logs").prepend("<p class='message'>" + (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds()) + ':' + (new Date().getMilliseconds()) + ' pong | ' + latency + "</p>")
        });*/
        socket.on('connect_error', (error) => {
            $("#logs").prepend("<p class='message'>" + (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds()) + ':' + (new Date().getMilliseconds()) + ' connect_error | ' + error + "</p>")
            $("#socketStatus").html("connect_error " + error)
            $("#socketId").val("")
        });
        socket.on('error', (error) => {
            $("#logs").prepend("<p class='message'>" + (new Date().getHours()) + ':' + (new Date().getMinutes()) + ':' + (new Date().getSeconds()) + ':' + (new Date().getMilliseconds()) + ' error | ' + error + "</p>")
            $("#socketStatus").html("error " + error)
            $("#socketId").val("")
        });
        //auto listen 
        socket.on($("#onlineSocketsEvent").val(), (msg) => {
            console.log('onlineSocketsEvent')
            $("#onlineSocketsLength").val(msg.length)
            //$("#socketId").val(socket.id);
            $("#onlineSockets_data").html("<p class='message'>" + JSON.stringify(msg) + "</p>")

        })

        socket.on($("#on_event").val(), (on_data) => {
            console.log(on_data + ' received on event : ' + $("#on_event").val())

            if (on_data.length) {
                on_dataLength.val(on_data.length)
            }
            //feedback.html('');

            $("#on_data").prepend("<p class='on_data'>" + JSON.stringify(on_data) + "</p>")
            counter++;
            $("#counter").val(counter)


        })

        socket.on($("#on_event2").val(), (on_data) => {

            console.log(on_data + ' received on event : ' + $("#on_event2").val())

            if (on_data.length) {
                on_dataLength.val(on_data.length)
            }
            //feedback.html('');

            $("#on_data2").prepend("<p class='on_data'>" + JSON.stringify(on_data) + "</p>")
            counter2++;
            $("#counter2").val(counter2)


        })
    }
    //buttons and inputs
    var on_dataLength = $("#on_dataLength")

    $("#server1").click(function () {
        $("#server").val('127.0.0.1')
    })

    $("#server2").click(function () {
        $("#server").val('192.168.100.101')
    })


    //var socket = io('http://' + $("#server").val() + ("#port").val());


    //Emit message
    $("#sendBtn").click(function () {
        console.log('EMIT, event : ' + $("#emit_event").val() + ' data : ' + $("#emit_data").val())
        socket.emit($("#emit_event").val(), { from: $("#socketId").val(), to: $("#emit_to").val(), data: $("#emit_data").val() })

    })

    $("#sendBtn2").click(function () {
        console.log('EMIT, event : ' + $("#emit_event2").val() + ' data : ' + $("#emit_data2").val())
        socket.emit($("#emit_event2").val(), { from: $("#socketId").val(), to: $("#emit_to").val(), data: $("#emit_data2").val() })

    })




    //on listen button click
    $("#listen").click(function () {

        a($("#server").val() + ':' + $("#port").val())
    })

});