chrome.runtime.onMessage.addListener(function(msg, sender, sendResp) {
    if (msg.command == "sendDialogError") {
        // Display error window

        if (!msg.msg.success) {

          $("#tx_loading").hide();
            if (msg.msg.error == "locked") {
                $(".unlock").show();
                $("#error-ok").hide();
                $("#no-unlock").click(function() {
                    window.close();
                });
                $("#yes-unlock").click(function() {
                    chrome.runtime.sendMessage({
                        command: "unlockFromDialog",
                        data: msg.msg.data,
                        tab: msg.tab,
                        mk: $("#unlock-dialog").val(),
                        domain: msg.domain,
                        request_id: msg.request_id
                    });
                });
                $('#unlock-dialog').keypress(function(e) {
                    if (e.keyCode == 13)
                        $('#yes-unlock').click();
                });
                $('#unlock-dialog').focus();
            }
            $("#dialog_header").html((msg.msg.error == "locked") ? "Unlock Keychain" : "Error");
            $("#dialog_header").addClass("error_header");
            $("#error_dialog").html(msg.msg.display_msg);
            $("#modal-body-msg").hide();
            $(".modal-body-error").show();
            $(".dialog-message").hide();
            $("#error-ok").click(function() {
                window.close();
            });
        }
    } else if (msg.command == "wrongMk") {
        $("#error-mk").html("Wrong password!");
    } else if (msg.command == "sendDialogConfirm") {
        // Display confirmation window
        $("#confirm_footer").show();
        $('#modal-body-msg').show();
        var type = msg.data.type;

        var titles = {
            'custom': 'Custom Transaction',
            'decode': 'Verify Key',
            'post': 'Post',
            'vote': 'Vote',
            'transfer': 'Transfer',
            'delegation':'Delegation'
        };
        var title = titles[type];
        $("#dialog_header").html(title);

        if (msg.data.display_msg) {
            $('#modal-body-msg .msg-data').css('max-height', '245px');
            $("#dialog_message").show();
            $("#dialog_message").html(msg.data.display_msg);
        }

        if (type == "transfer") {
            $('#modal-body-msg .msg-data').css('max-height', '200px');
            let accounts = msg.accounts;
            console.log(accounts, msg.data);
            if (msg.data.username !== undefined) {
                let i = msg.accounts.findIndex(function(elt) {
                    return elt.name == msg.data.username;
                });

                let first = [accounts[i]];
                delete accounts[i];
                console.log(first, accounts);
                accounts = first.concat(accounts);

                console.log(accounts);
            }
            for (acc of accounts) {
                if (acc != undefined)
                    $("#select_transfer").append("<option>" + acc.name + "</option>");
            }
            initiateCustomSelect();
        }
        var message = "";
        $("." + type).show();
        $(".modal-body-error").hide();
        $("#username").html("@" + msg.data.username);
        $("#modal-content").css("align-items", "flex-start");
        if (type != "transfer" && type!= "delegation") {
            $("#keep_div").show();
            var prompt_msg = (msg.data.type == 'decode') ? "Do not prompt again to verify keys for the @" + msg.data.username + " account on " + msg.domain :
                "Do not prompt again to send " + msg.data.type + " transactions from the @" + msg.data.username + " account on " + msg.domain
            $("#keep_label").text(prompt_msg);
        } else {
            $(".keep_checkbox").css("display", "none");
        }
        switch (type) {
            case "decode":
                $("#wif").html(msg.data.method);
                $('#modal-body-msg').css('max-height', '235px');
                $("#dialog_message").show();
                $("#dialog_message").html('The website ' + msg.domain + ' would like to verify that you have access to the private ' + msg.data.method + ' key for the account: @' + msg.data.username);
                break;
            case "vote":
                $("#weight").html(msg.data.weight / 100 + " %");
                $("#author").html('@' + msg.data.author);
                $("#perm").html(msg.data.permlink);
                break;
            case "custom":
                $("#custom_data").click(function() {
                    $("#custom_json").slideToggle();
                });
                $("#custom_json").html(msg.data.id + '<br/>' + msg.data.json);
                $("#custom_key").html(msg.data.method);
                break;
            case "transfer":
                $("#to").html('@' + msg.data.to);
                $("#amount").html(msg.data.amount + " " + msg.data.currency);
                $("#memo").html(msg.data.memo);
                if (msg.data.memo.length > 0)
                    $(".transfer_memo").show();
                break;
            case "post":
                $("#body_toggle").click(function() {
                    $("#body").slideToggle();
                });
                $("#options_toggle").click(function() {
                    $("#options").slideToggle();
                });
                $("#title").html(msg.data.title);
                $("#permlink").html(msg.data.permlink);
                $("#body").html(msg.data.body);
                $("#json_metadata").html(msg.data.json_metadata);
                $("#parent_url").html(msg.data.parent_perm);
                $("#parent_username").html(msg.data.parent_username);
                if(msg.data.comment_options!=""){
                  let options=JSON.parse(msg.data.comment_options);
                  $("#max_payout").html(options.max_accepted_payout);
                  $("#percent_sbd").html(options.percent_steem_dollars);
                  $("#allow_votes").html(options.allow_votes);
                  $("#allow_curation_rewards").html(options.allow_curation_rewards);
                  let beneficiaries="";
                  for (benef of options.extensions[0][1].beneficiaries){
                    beneficiaries+="@"+benef.account+" ("+(benef.weight/100).toFixed(2)+"%) ";
                  }
                  if(beneficiaries!="")
                    $("#beneficiaries").html(beneficiaries);
                  else
                    $("#beneficiaries_div").hide();
                }
                else $("#options_toggle").hide();
                if (msg.data.parent_username == "" ||msg.data.parent_username == null || msg.data.parent_username == undefined){
                    $("#parent_username").hide();
                    console.log("hideee");
                    $("#parent_username_title").hide();
                  }
                break;
            case "delegation":
                $("#delegatee").html("@"+msg.data.delegatee);
                $("#amt_sp").html(msg.data.sp+" SP");
                break;
        }

        // Closes the window and launch the transaction in background
        $("#proceed").click(function() {
            let data = msg.data;
            if (data.type == "transfer")
                data.username = $("#select_transfer option:selected").val();
            console.log(data);
            chrome.runtime.sendMessage({
                command: "acceptTransaction",
                data: data,
                tab: msg.tab,
                domain: msg.domain,
                keep: $("#keep").is(':checked')
            });
            if (type == 'decode')
                window.close();
            else {
                $("#confirm_footer").hide();
                $("#modal-body-msg").hide();
                $(".dialog-message").hide();
                $('#tx_loading').show();
            }
        });

        // Closes the window and notify the content script (and then the website) that the user refused the transaction.
        $("#cancel").click(function() {
            window.close();
        });
    } else if (msg.command == "answerRequest") {
        $('#tx_loading').hide();
        $("#dialog_header").html((msg.msg.success == true) ? "Success!" : "Error!");
        $("#error_dialog").html(msg.msg.message);
        $(".modal-body-error").show();
        $("#error-ok").click(function() {
            window.close();
        });
    }
});

function initiateCustomSelect() {
    /*look for any elements with the class "custom-select":*/
    x = document.getElementsByClassName("custom-select");

    for (i = 0; i < x.length; i++) {
        selElmnt = x[i].getElementsByTagName("select")[0];

        /*for each element, create a new DIV that will act as the selected item:*/
        a = document.createElement("DIV");
        a.setAttribute("class", "select-selected");
        a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
        x[i].appendChild(a);
        /*for each element, create a new DIV that will contain the option list:*/
        b = document.createElement("DIV");
        b.setAttribute("class", "select-items select-hide");
        for (j = 0; j < selElmnt.length; j++) {
            /*for each option in the original select element,
            create a new DIV that will act as an option item:*/
            c = document.createElement("DIV");
            c.innerHTML = selElmnt.options[j].innerHTML;
            c.addEventListener("click", function(e) {
                /*when an item is clicked, update the original select box,
                and the selected item:*/
                var y, i, k, s, h;
                s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                h = this.parentNode.previousSibling;
                for (i = 0; i < s.length; i++) {
                    if (s.options[i].innerHTML == this.innerHTML) {
                        s.selectedIndex = i;
                        h.innerHTML = this.innerHTML;
                        y = this.parentNode.getElementsByClassName("same-as-selected");
                        for (k = 0; k < y.length; k++) {
                            y[k].removeAttribute("class");
                        }
                        this.setAttribute("class", "same-as-selected");
                        break;
                    }
                }
                h.click();
            });
            b.appendChild(c);
        }
        x[i].appendChild(b);
        a.addEventListener("click", function(e) {
            /*when the select box is clicked, close any other select boxes,
            and open/close the current select box:*/
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });
    }

    function closeAllSelect(elmnt) {
        /*a function that will close all select boxes in the document,
        except the current select box:*/
        var x, y, i, arrNo = [];
        x = document.getElementsByClassName("select-items");
        y = document.getElementsByClassName("select-selected");
        for (i = 0; i < y.length; i++) {
            if (elmnt == y[i]) {
                arrNo.push(i)
            } else {
                y[i].classList.remove("select-arrow-active");
            }
        }
        for (i = 0; i < x.length; i++) {
            if (arrNo.indexOf(i)) {
                x[i].classList.add("select-hide");
            }
        }
    }
    /*if the user clicks anywhere outside the select box,
    then close all select boxes:*/
    document.addEventListener("click", closeAllSelect);
}
