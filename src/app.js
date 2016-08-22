// Here is the starting point for your application code (not the electron main).
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import { remote, ipcRenderer } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';

console.log('Loaded environment variables:', env);

var app = remote.app;

var appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);

function fetchClassExtension(className, callback) {
    var http = require('http');
    const url = "http://api.ai.codes/jvm/usage/" + className;
    http.get(url, (response) => {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var parsed = JSON.parse(body);
            callback(parsed);
        });
    });
}

var iceModel = new Map();

function updateICEDisplay(error, iceId, intention, className_context, extension) {
    "use strict";
    // TODO(exu): Objectify iceModel.
    if (iceModel.get('id') == iceId) {
        if (! iceModel.get('context').has(className_context)) {
            iceModel.get('context').add(className_context);
            iceModel.get('extension').add(extension);
        }
    } else {    // construct a new ice Model
        iceModel.clear();
        iceModel.set('id', iceId);
        iceModel.set('intention', intention)
        iceModel.set('context', new Set());
        iceModel.get('context').add(className_context);
        iceModel.set('extension', new Set());
        iceModel.get('extension').add(extension);
    }
    iceModelToDisplay(iceModel);
}

function iceModelToDisplay(iceModel) {
    var intentionNode = document.getElementById("intention");
    var contextNode = document.getElementById("context");
    var extensionNode = document.getElementById("extension");
    // Clean slade
    while (intentionNode.firstChild) {
        intentionNode.removeChild(intentionNode.firstChild);
    }
    while (contextNode.firstChild) {
        contextNode.removeChild(contextNode.firstChild);
    }
    while (extensionNode.firstChild) {
        extensionNode.removeChild(extensionNode.firstChild);
    }

    intentionNode.appendChild(document.createTextNode(iceModel.get('intention')));
    for (let item of iceModel.get('context')) {
        contextNode.appendChild(document.createTextNode(item + "; "));
    }
    for (let item of iceModel.get('extension')) {
        extensionNode.appendChild(
            document.createElement("PRE").appendChild(
                document.createElement("CODE").appendChild(
                    document.createTextNode(JSON.stringify(item, null, 2)))));
    }
}

var plotGoogleCharts = function(usage) {
    "use strict";
    var json_usage = JSON.parse(usage);
    var data = new google.visualization.DataTable();

    data.addColumn('string', 'Method');
    data.addColumn('number', 'Frequency');

    for (var name in json_usage) {
        data.addRow([name, json_usage[name]]);
    }
    var chart = new google.visualization.BarChart(document.getElementById('chart_div'));
    var options = {
        width: 500,
        height: 800,
        bar: {groupWidth: "95%"},
        legend: 'none',
        vAxis: {
            textStyle: {
                'fontName': 'Source Code Pro',
            }
        }
    };
    chart.draw(data, options);
};

ipcRenderer.on('ice-display', updateICEDisplay);

ipcRenderer.on('ice-lookup', (event, iceId, intention, className) => {
    fetchClassExtension(className, extension => {
        "use strict";
        ipcRenderer.send('ice-cache', className, extension);
        updateICEDisplay(null, iceId, intention, className, extension);
    });
});
