/*
 * Initializes pickers for time and date
 * called after options are loaded because it needs it for date format
 */
function initTimePickers () {

    flatpickr.init.prototype.l10n.firstDayOfWeek = 1;

    timePicker = flatpickr("#new-time-input", {
        minDate: new Date(new Date().getTime() + 60000),
        defaultDate: new Date(new Date().getTime() + 60000),

        timeFormat: "H:i",
        minuteIncrement: 1
    });

    timePicker.set("onChange", function(d){

        var now = new Date();

        if (d.getTime() < now.getTime()) {
            //timePicker.set( "defaultDate" , now );
            document.getElementById('new-time-input').value = (" " + now.getHours() + ":" + now.getMinutes()).toString();
        }

    });


    //TODO: CHANGE!
    datePicker = flatpickr("#new-date-input", {
        minDate: new Date(),
        defaultDate: new Date(),
        dateFormat: pickrDateFormat()
    });
    //datePicker.set("onChange", function(d){
    //
    //});

}


/*
 * GLOBALS
 */
var options = {};
//lists for drop-down selection
var dateFormatList = [ "DD.MM.YYYY", "DD.MM.YY", "DD/MM/YYYY", "MM.DD.YYYY" ];
//time-picker variables
var timePicker;
var datePicker;


/*
 * Localises HTML based on messages.json
 * TAKEN: http://stackoverflow.com/questions/25467009/internationalization-of-html-pages-for-my-google-chrome-extension
 */
function localizeHtmlPage() {
    //Localize by replacing __MSG_***__ meta tags
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++)
    {
        var obj = objects[j];

        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
        {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if(valNewH != valStrH)
        {
            obj.innerHTML = valNewH;
        }
    }
}


/*
 * LOAD options
 *
 * date-time pickers can cause problems when not loaded after options
 * however, there is a chance that options will be loaded before DOM, then simply move load options into DOMContentLoaded
 */
function loadOptions () {
    chrome.storage.sync.get('AM_options', function (object) {

        options = object.AM_options;

        //override index value with real value
        options.date_format = dateFormatList[options.date_format];

        initTimePickers();

    });
}
loadOptions();


/*
 * MAIN and FIRST Function (probably loaded after 'background.js'
 * loads all events and handlers that will be on popup DOM
 *
*/
document.addEventListener('DOMContentLoaded', function() {

    //localise HTML
    localizeHtmlPage();

    //runs clock in background of popup
    popupClock();
    //event for opening options from popup
    openOptions();
    //inserts existing alarms in popup
    getAlarmList();
    //adds section for new alarm in popup
    initNewAlarm();

});


/*
 * Creates tooltip/notify element and inserts it into element for display
 * WARNING: can only be called on container, not individual element!
 *
 * @param {html} element - html object of element where tooltip will be inserted
 * @param {string} title - text that will be displayed in title (short)
 * @param {string} content - text that will be inserted into body of tooltip
 */
function initNotify () {

    Element.prototype.notify = function(title, content) {
        var el = this;

        var ntf = document.createElement("span");
        ntf.setAttribute("class", "tooltip-notification");
        var ntf_title = document.createElement("h6");
        ntf_title.innerHTML = title.toUpperCase();
        ntf.appendChild( ntf_title );
        var ntf_body = document.createElement("p");
        ntf_body.innerHTML = content;
        ntf.appendChild( ntf_body );

        var ntfSelfRemove = function () {
            var ttps = el.getElementsByClassName("tooltip-notification");
            for (var i = 0; i < ttps.length; i++) {
                ttps[i].remove();
            }
        }.bind(el);

        ntf.addEventListener("click", ntfSelfRemove);
        this.insertBefore(ntf, this.firstChild);
        setTimeout(ntfSelfRemove, 5000);

    };

}
initNotify();


/*
 * Removes all tooltips from popup
 * Takes care of situation when new alarm is closed etc
 *
 * @returns {null}
 */
function removeTooltips() {
    var ttps = document.getElementsByClassName("tooltip-notification");
    for (var i = 0; i < ttps.length; i++) {
        ttps[i].remove();
    }
}


/*
 * Prepares date-time object to be displayed in DOM
 *
 * @param {int} ex - existing datetime unix number format (time from 1970)
 * @return {object} date/time - processed string ready for DOM
 */
function displayTime (ex) {

    var t = ex ? new Date(ex) : new Date();

    var addZero = function (n) {
            var x = n.toString();
            if (x.length < 2) { return '0' + x; }
            else { return x; }
        };

    var time = addZero( t.getHours() ) + ":" + addZero( t.getMinutes() );

    var date;
    switch(options.date_format) {
        case "DD.MM.YY":
            date = addZero( t.getDate() ) + "." + addZero( t.getMonth() + 1 ) + "." + addZero( t.getFullYear().toString().substring(2) );
            break;
        case "DD/MM/YYYY":
            date = addZero( t.getDate() ) + "/" + addZero( t.getMonth() + 1 ) + "/" + addZero( t.getFullYear() );
            break;
        case "MM.DD.YYYY":
            date = addZero( t.getMonth() + 1 ) + "." + addZero( t.getDate() ) + "." + addZero( t.getFullYear() );
            break;
        default:
            //case "DD.MM.YYYY":
            date = addZero( t.getDate() ) + "." + addZero( t.getMonth() + 1 ) + "." + addZero( t.getFullYear() );
    }

    return {
        time: time,
        date: date
    }
}


/*
 * Reverts date format from user-display to universal
 *
 * @param {string} date - date in current display format
 * @param {string} time - time in hh:mm format (default 00:00:00)
 */
function revertTime (date, time) {
    time = time || "00:00:00";
    var revert, s;

    switch(options.date_format) {
        case "DD.MM.YY":
            s = date.split(".");
            revert = new Date ( "20" + s[2] + "/" + s[1] + "/" + s[0] + " " + time );
            break;
        case "DD/MM/YYYY":
            s = date.split("/");
            revert = new Date ( s[2] + "/" + s[1] + "/" + s[0] + " " + time );
            break;
        case "MM.DD.YYYY":
            s = date.split(".");
            revert = new Date ( s[2] + "/" + s[0] + "/" + s[1] + " " + time );
            break;
        default:
            //case "DD.MM.YYYY":
            s = date.split(".");
            revert = new Date ( s[2] + "/" + s[1] + "/" + s[0] + " " + time );
    }

    return revert;
}


/*
 * Renders date format for datePicker
 */
function pickrDateFormat () {
    var format = options.date_format,
        final = [];

    var split = format.split(".");

    final[0] = split[0][0].toLowerCase();
    final[1] = split[1][0].toLowerCase();
    final[2] = split[2].length > 2 ? "Y" : "y";

    return format.split(".").length > 1 ? final.join(".") : final.join("/");
}


/*
 * Sets clock roller on popup
 * Every second checks time and changes it if needed
 * @return {null}
 */
function popupClock () {

    function rollClock (){

        var t = displayTime();

        document.getElementById('time').innerHTML = t.time;
        document.getElementById('date').innerHTML = t.date;

    }
    rollClock();

    window.setInterval(rollClock, 1000);
}


/*
 * open OPTIONS tab
*/
function openOptions () {

    document.getElementById('link-options').addEventListener('click', function () {

        //chrome.tabs.create({ 'url': 'chrome-extension://' + chrome.runtime.id + '/options/options.html#instructions' });

        if (chrome.runtime.openOptionsPage) {
            // New way to open options pages, if supported (Chrome 42+).
            chrome.runtime.openOptionsPage();
        } else {
            // Reasonable fallback.
            window.open(chrome.runtime.getURL('options/options.html'));
        }

    });
}


/* TEMPLATE for alarm popup list
 *    <div class="alarm" key="ALARM_KEY">
 *        <div class="alarm-actions"> <input type="button" class="alarm-remove"> </div>
 *
 *        <div class="alarm-container">
 *            <div class="alarm-head">
 *                <div class="datetime">
 *                    <p class="time">06:12</p>
 *                    <p class="date">22.07.2016</p>
 *                </div>
 *                <div class="alarm-name"> <p> ALARM NAME </p> </div>
 *            </div>
 *
 *            <div class="alarm-body">
 *               <div class="alarm-desc"> <p> ALARM DESCRIPTION </p> </div>
 *            </div>
 *        </div>
 *
 *    </div>
 * @param {object} alarm - alarm object from (as in storage)
 * @returns {html} div - html alarm object
 */
function alarmTemplate(alarm) {
    var html = document.createElement("div");
    html.setAttribute("class", "alarm");
    html.setAttribute("key", alarm.key);

    //alarm-actions and button
    var actions = document.createElement("div");
    actions.setAttribute("class", "alarm-actions");
        var input = document.createElement("input");
        input.setAttribute("class", "alarm-remove");
        input.setAttribute("type", "button");
    actions.appendChild(input);


    //alarm-container
    var container = document.createElement("div");
    container.setAttribute("class", "alarm-container");

        var head = document.createElement("div");
        head.setAttribute("class", "alarm-head");

            var dt = displayTime(alarm.time_set);

            var head_datetime = document.createElement("div");
            head_datetime.setAttribute("class", "datetime");

                var time = document.createElement("p");
                time.setAttribute("class", "time");
                time.innerHTML = dt.time;
                var date = document.createElement("p");
                date.setAttribute("class", "date");
                date.innerHTML = dt.date;

            head_datetime.appendChild(time);
            head_datetime.appendChild(date);

            var head_name = document.createElement("div");
            head_name.setAttribute("class", "alarm-name");
                var alarm_name = document.createElement("p");
                alarm_name.innerHTML = alarm.name;
            head_name.appendChild(alarm_name);

        head.appendChild(head_datetime);
        head.appendChild(head_name);


        var body = document.createElement("div");
        body.setAttribute("class", "alarm-body");
            var body_desc = document.createElement("div");
            body_desc.setAttribute("class", "alarm-desc");
                var alarm_desc = document.createElement("p");
                alarm_desc.innerHTML = alarm.desc;
            body_desc.appendChild(alarm_desc);
        body.appendChild(body_desc);


    container.appendChild(head);
    container.appendChild(body);

    html.appendChild(actions);
    html.appendChild(container);

    return html;
}


/*
 * Changes visibility of new alarm section
 */
function toggleNewAlarm () {

    var hidden = document.getElementById("alarm-new-container").className.length;

    if (!hidden) {
        document.getElementById("alarm-new-container").className = "hidden";
        document.getElementById("toggle-new-alarm").value = chrome.i18n.getMessage("newAlarm");
    } else {
        document.getElementById("alarm-new-container").className = "";
        document.getElementById("toggle-new-alarm").value = chrome.i18n.getMessage("cancelAlarm");
    }

    removeTooltips();
}


/*
 * CONSTRAINTS when creating new alarm
 *
 * TODO
 */
function checkConstraints () {
    var fail = false;

    // CONSTRAINT 1 - alarm in past
    var input_date = document.getElementById("new-date-input").value,
        input_h = document.getElementById("new-time").getElementsByClassName("flatpickr-hour")[0].value,
        input_min = document.getElementById("new-time").getElementsByClassName("flatpickr-minute")[0].value;

    var alarm_time = revertTime(input_date, input_h + ":" + input_min + ":00"),
        now = new Date();

    if (alarm_time.getTime() <= now.getTime()) {
        document.getElementById("new-time").notify("warning", chrome.i18n.getMessage("ntfHistoryAlarm") );

        //error class
        var clsTime = document.getElementById("new-time").getElementsByClassName("flatpickr-calendar")[0];
        var clsDate = document.getElementById("new-date-input");
        clsTime.setAttribute("class", clsTime.getAttribute("class") + " error");
        clsDate.setAttribute("class", clsDate.getAttribute("class") + " error");
        setTimeout(function () {
            var clsTime = document.getElementById("new-time").getElementsByClassName("flatpickr-calendar")[0];
            var clsDate = document.getElementById("new-date-input");
            clsTime.setAttribute("class", clsTime.getAttribute("class").replace(" error", "") );
            clsDate.setAttribute("class", clsDate.getAttribute("class").replace(" error", "") );
        }, 2000);

        fail = true;
    }

    return fail;
}


/*
 * APP CORE
 * EVENT setter and functions for "New alarm" section
 *
 * Handles all functionality of adding new alarm
 *
 * @function resetNA - resets fields on new alarm section (hours and minutes to current time, name and description empty)
 * @function setNA - MAIN; creates alarm and stores it into storage
 *
 * @returns {null}
 *
 */
function initNewAlarm() {

    /*
     * Resets data in new alarm section
     */
    function resetNA() {

        document.getElementById('new-name-input').value = '';
        document.getElementById('new-desc-input').value = '';

        //create time one minute ahead of now
        var t = new Date( new Date().getTime() + 60000 );
        document.getElementById("new-time").getElementsByClassName("flatpickr-hour")[0].value = t.getHours();
        document.getElementById("new-time").getElementsByClassName("flatpickr-minute")[0].value = t.getMinutes();

        document.getElementById("new-date-input").value = displayTime(t).date;
        datePicker.setDate(t);

    }
    document.getElementById('alarm-reset').addEventListener('click', resetNA);


    /*
     * KEY function for extension
     * creates new alarm, creates key and takes data from popup UI that user entered
     * calculates difference between current time and alarm time and stores data to new object
     * async call to storage to store new alarm, creates template for UI and creates alarm based on data given
     * resets new alarm fields
     *
     * Most delicate part is calculation of alarm
     *
     * @returns {null}
     */
    function setNA() {

        //constraints before creating new alarm
        var fail = checkConstraints();
        if (fail) {
            return false;
        }


        //random key generator
        //6 character alphanumeric string
        function make_key() {
            return Math.random().toString(36).substring(2,8);
        }

        //calculates how much time is till alarm
        function timeToAlarm (t) {
            var s = parseInt(t / 1000); //ignore milliseconds, round seconds
            var d = parseInt(s / 86400);
            var h = parseInt((s / 3600) % 24);
            var m = parseInt((s / 60) % 60);

            return (d > 0 ? d + " "+ chrome.i18n.getMessage("day") +" " : "") + (h > 0 ? h + " "+ chrome.i18n.getMessage("hour") +" " : "") + m + " "+ chrome.i18n.getMessage("minute") +"!" ;
        }


        /*
         * ALARM object
         * @param {string} key - 6-char alphanumeric string used as identifier
         * @param {int} time_created - time at which alarm was created (ms from 1970)
         * @param {int} time_set - time when alarm was supposed to activate (ms from 1970)
         * @param {int} time_span - difference between current time and time when alarm is to be activated (ms)
         * @param {int} time_snoozed - REMOVED //TODO potentially implement
         */
        var alarm = {
            key: make_key(),
            name: document.getElementById('new-name-input').value,
            desc: document.getElementById('new-desc-input').value,
            time_created: new Date().getTime(),
            time_set: "",
            time_span: ""
        };


        //time is taken from picker that has date object
        //when seconds set to something, picker will change date object but action itself returns time in milliseconds
        var input_date = document.getElementById("new-date-input").value,
            input_h = document.getElementById("new-time").getElementsByClassName("flatpickr-hour")[0].value,
            input_min = document.getElementById("new-time").getElementsByClassName("flatpickr-minute")[0].value;

        alarm.time_set = revertTime(input_date, input_h + ":" + input_min + ":00").getTime();
        alarm.time_span = alarm.time_set - alarm.time_created;


        //ASYNC!
        //get alarm list and add new alarm
        var storage_callback = function (object) {
            var alarms = object.AM_alarms;

            //save new alarm to alarm list
            alarms.push(alarm);
            chrome.storage.sync.set({'AM_alarms': alarms});

            //add alarm to list
            var alarm_el = alarmTemplate(alarm);
            alarm_el.getElementsByClassName('alarm-remove')[0].addEventListener('click', removeAlarm);
            document.getElementById('alarm-list').appendChild(alarm_el);


            //notify user that alarm is created and will be processed in X minutes
            var alarm_list = document.getElementById("alarm-list").getElementsByClassName("alarm");
            for (var i = 0; i < alarm_list.length; i++) {
                if (alarm_list[i].getAttribute("key") === alarm.key) {
                    alarm_list[i].notify("alarm created", chrome.i18n.getMessage("ntfAlarmRing") + timeToAlarm(alarm.time_span));
                }
            }

        }.bind(alarm); //pushing variable alarm into scope!
        chrome.storage.sync.get('AM_alarms', storage_callback);


        //create alarm -> 1 minute = 60,000 milliseconds
        chrome.alarms.create(alarm.key, { delayInMinutes: (alarm.time_span / 60000) });

        resetNA();
        toggleNewAlarm();
    }
    document.getElementById('alarm-set').addEventListener('click', setNA);


    //toggles visibility of new alarm section
    document.getElementById("toggle-new-alarm").addEventListener('click', toggleNewAlarm);
}


/*
 * EVENT for removing alarm
 * activated when button is pressed on alarm list
 * removes from storage, cancels alarm and removes from UI
 *
 * @param {event} e
 * @returns {null}
 */
function removeAlarm() {
    var alarm_el = this.parentElement.parentElement;

    var storage_callback = function (object) {
        var alarms = object.AM_alarms,
            key = alarm_el.getAttribute('key');

        //stop alarm from triggering
        chrome.alarms.clear(key);


        //remove from storage
        for (var i = 0; i < alarms.length; i++) {
            if (key == alarms[i].key) {
                alarms.splice(i, 1);
            }
        }
        //@param {object} - data object to be saved as JSON
        chrome.storage.sync.set({'AM_alarms': alarms});


        //remove from UI
        var alarm_list = document.getElementsByClassName('alarm');
        for (i = 0; i < alarm_list.length; i++) {
            if (key == alarm_list[i].getAttribute('key')) {
                alarm_list[i].remove();
            }
        }

    }.bind(alarm_el); //pushing variable alarm into scope!
    chrome.storage.sync.get('AM_alarms', storage_callback);

}


/*
 * Gets alarms from storage and via template adds to popup DOM
 * adds event for alarm removal
 *
 * @returns {null}
 */
function getAlarmList() {

    //fetches all alarms from storage and ASYNC adds to DOM
    chrome.storage.sync.get('AM_alarms', function (object) {
        var alarms = object.AM_alarms,
            list = document.getElementById('alarm-list'),
            alarm = null;

        for (var i = 0; i < alarms.length; i++) {
            //create alarm HTML template
            alarm = alarmTemplate(alarms[i]);
            //add remove event
            alarm.getElementsByClassName('alarm-remove')[0].addEventListener('click', removeAlarm);
            //add alarm to DOM
            list.appendChild( alarm );
        }

        if (alarms.length == 0) {
            toggleNewAlarm();
        }

    });

}


/*
 * UI update for alarms when called from notifications
 * Current options are to REMOVE or SNOOZE alarm
 *
 * 'background.js' notification/alarm activation interface has handlers for alarms/notifications
 * This function receives updates regarding UI update for popup and returns request (for easier keeping)
 *
 * @param {object} request - contains data on how to process alarm
 * @param {object} sender - contains extension ID and extension URL
 * @param {function} sendResponse - callback function via which response is returned
 * @returns {null}
 */
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
        var key = request.key,
            list, i;

        //remove alarm from UI
        if (request.action == "remove") {

            list = document.getElementById('alarm-list').getElementsByClassName('alarm');

            for (i = 0; i < list.length; i++) {

                if (key == list[i].getAttribute('key')) {
                    list[i].remove();
                    break;
                }

            }

            sendResponse(request);
        }
        //change alarm time in UI
        else if (request.action == "snooze") {

            list = document.getElementById('alarm-list').getElementsByClassName('alarm');
            var alarm = request.alarm;

            for (i = 0; i < list.length; i++) {

                if (key == list[i].getAttribute('key')) {

                    //change time in alarm
                    var alarm_dt = displayTime(alarm.time_set);
                    list[i].getElementsByClassName('time')[0].innerHTML = alarm_dt.time;
                    list[i].getElementsByClassName('date')[0].innerHTML = alarm_dt.date;

                    break;
                }

            }

            sendResponse(request);

        }

    }
);















