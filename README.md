# Draw plugin


### IMPORTANT!!
### THIS PLUGIN IS NOT REQUIRED WITH ORIGO > 2.7.0 SINCE IT IS PART OF THE CORE


Draw tool plugin for Origo.

Requires a version of Origo master not older than 2020-02-13.

#### Example usage of Draw plugin

**index.html:**
```
    <head>
    	<meta charset="utf-8">
    	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    	<meta http-equiv="X-UA-Compatible" content="IE=Edge;chrome=1">
    	<title>Origo exempel</title>
    	<link href="css/style.css" rel="stylesheet">
    	<link href="plugins/draw.css" rel="stylesheet">
    </head>
    <body>
    <div id="app-wrapper">
    </div>
    <script src="js/origo.js"></script>
    <script src="plugins/draw.min.js"></script>

    <script type="text/javascript">
      //Init origo
      var origo = Origo('index.json');
      origo.on('load', function (viewer) {
        var draw = Draw({
          buttonText: 'Rita',
          drawTools: {
            "Polygon": ["freehand", "box"],
            "LineString": ["freehand"]
          }
        });
        viewer.addComponent(draw);
      });
    </script>
```
