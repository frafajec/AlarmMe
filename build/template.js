/*
 * GLOBALS
 */
var displayTime = displayTime || undefined;
var chrome = chrome || undefined;


/*
 * Helper function that renders templates for app
 *
 * alarmTemplate - renders template for alarms in list on popup.js
 */
function template (template, data) {
    var html = "";

    //TEMPLATES
    function alarmTemplate(alarm, data) {

        if (!data) { data = {}; }

        //FALLBACK from older version when alarms didn't have rep_days!
        if (!alarm.hasOwnProperty("repetitive")) {
            alarm.repetitive = false;
            alarm.rep_days = [0, 0, 0, 0, 0, 0, 0];
        }
        if (!alarm.hasOwnProperty("active")) {
            alarm.active = true;
        }


        var html = document.createElement("div");
        html.setAttribute("class", "alarm");
        html.setAttribute("key", alarm.key);

        //alarm-container
        var container = document.createElement("div");
        container.setAttribute("class", "alarm-container");
        container.setAttribute("state", alarm.active ? "active" : "inactive");
        container.setAttribute("title", alarm.active ? "" : chrome.i18n.getMessage("alarmInactive"));


            //BODY
            var body = document.createElement("div");
            body.setAttribute("class", "alarm-body");

                var dt = displayTime(alarm.time_set);

                // Checks if alarm is set today, hide date then!
                var set_today = (new Date().toDateString()) === (new Date(alarm.time_set).toDateString());
                var body_datetime = document.createElement("div");
                body_datetime.setAttribute("class", set_today ? "datetime set-today" : "datetime");

                    var time = document.createElement("p");
                    time.setAttribute("class", "time");
                    time.innerHTML = dt.time;
                    var date = document.createElement("p");
                    date.setAttribute("class", "date");
                    date.innerHTML = dt.date;

                body_datetime.appendChild(time);
                body_datetime.appendChild(date);

                var body_name = document.createElement("div");
                body_name.setAttribute("class", "alarm-meta");
                    var alarm_name = document.createElement("p");
                    alarm_name.setAttribute("class", "alarm-name");
                    alarm_name.innerHTML = alarm.name;
                body_name.appendChild(alarm_name);


                if (!alarm.repetitive) {
                    var alarm_desc = document.createElement("p");
                    alarm_desc.setAttribute("class", "alarm-desc");
                    alarm_desc.innerHTML = alarm.desc;
                    body_name.appendChild(alarm_desc);
                } else {
                    var alarm_rep = document.createElement("p");
                    alarm_rep.setAttribute("class", "alarm-days");

                    var span,
                        days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

                    for (var i = 0; i < 7; i++) {
                        span = document.createElement("span");
                        span.innerHTML = chrome.i18n.getMessage(days[i]).charAt(0);
                        span.setAttribute("class", alarm.rep_days[i] ? "active" : "" );
                        alarm_rep.appendChild(span);
                    }
                    body_name.appendChild(alarm_rep);
                }

                body.appendChild(body_datetime);
                body.appendChild(body_name);

            container.appendChild(body);

            //OPTIONS or ACTION to cancel ring
            var alarm_ring, alarm_options;
            if (alarm.ringing) {

                alarm_ring = document.createElement("input");
                alarm_ring.setAttribute("class", "alarm-ring-cancel");
                alarm_ring.setAttribute("type", "button");

            } else {

                alarm_options = document.createElement("div");
                alarm_options.setAttribute("class", "alarm-options");
                alarm_options.setAttribute("state", data.options_opened ? "open" : "closed");

                    var options_actions = document.createElement("div");
                        options_actions.setAttribute("class", "alarm-actions");

                        var action_remove = document.createElement("i");
                        action_remove.setAttribute("class", "fa fa-trash fa-lg alarm-remove");
                        action_remove.setAttribute("title", chrome.i18n.getMessage("titleRemove"));
                        action_remove.setAttribute("aria-hidden", "true");
                        options_actions.appendChild(action_remove);

                        var action_edit = document.createElement("i");
                        action_edit.setAttribute("class", "fa fa-pencil-square-o fa-lg alarm-edit");
                        action_edit.setAttribute("title", chrome.i18n.getMessage("titleEdit"));
                        action_edit.setAttribute("aria-hidden", "true");
                        options_actions.appendChild(action_edit);

                        var action_state = document.createElement("i");
                        action_state.setAttribute("class", "fa fa-toggle-on fa-lg "+ (alarm.active ? "" : "fa-rotate-180") +" alarm-change-state");
                        action_state.setAttribute("title", chrome.i18n.getMessage("titleState"));
                        action_state.setAttribute("aria-hidden", "true");
                        options_actions.appendChild(action_state);

                    alarm_options.appendChild(options_actions); //buttons for options from above

                    var options_toggle = document.createElement("i");
                        options_toggle.setAttribute("class", "fa fa-cog alarm-options-toggle");
                        options_toggle.setAttribute("title", chrome.i18n.getMessage("titleOptions"));
                        options_toggle.setAttribute("aria-hidden", "true");

                    alarm_options.appendChild(options_toggle); //adding action menu into alarm

            }

            container.appendChild(alarm_ring || alarm_options);

        html.appendChild(container);

        return html;
    }

    function notifyTemplate(data) {

        var container = document.createElement("div");
        container.setAttribute("class", "notify " + (data.type ? data.type : ""));

            var stateIcon = document.createElement("div");
            stateIcon.setAttribute("class", "stateIcon");

                var icon = document.createElement("i");
                icon.setAttribute("class", "fa " + (data.type === "warning" ? "fa-times" : "fa-check") + " fa-lg");
                icon.setAttribute("aria-hidden", "true");
                stateIcon.appendChild(icon);


            var stateField = document.createElement("div");
            stateField.setAttribute("class", "stateField");

                var title = document.createElement("span");
                title.setAttribute("class", "fieldTitle");
                title.innerHTML = data.title;
                stateField.appendChild(title);

                var desc = document.createElement("span");
                desc.setAttribute("class", "fieldDesc");
                desc.innerHTML = data.desc;
                stateField.appendChild(desc);

            container.appendChild(stateIcon);
            container.appendChild(stateField);

        return container;
    }

    //FORKING
    if (template === 'alarm') { html = alarmTemplate(data.alarm, data.data); }
    if (template === 'notify') { html = notifyTemplate(data); }


    return html;
}
template(true, {});