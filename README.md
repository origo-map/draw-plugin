# draw-plugin
Draw tool plugin for Origo

Necessary changes in Origo for draw pluging to work properly:

1) index.html:
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
<script src="plugins/draw.js"></script>

<script type="text/javascript">
	//Init origo
	var origo = Origo('index.json');
	origo.on('load', function (viewer) {
		var draw = Draw({
			buttonText: 'Rita'
		});
		viewer.addComponent(draw);
	});
</script>

2) origo.js:
import Style from './src/style';
import featurelayer from './src/featurelayer';
.
.
.
Origo.Style = Style;
Origo.featurelayer = featurelayer;

3) css\svg\fa-icons.svg:
<symbol id="fa-map-marker" viewBox="0 0 512 512">
      <path d="m329 183c0-20-7-38-21-52-15-14-32-21-52-21-20 0-37 7-52 21-14 14-21 32-21 52 0 20 7 37 21 52 15 14 32 21 52 21 20 0 37-7 52-21 14-15 21-32 21-52z m73 0c0 21-3 38-9 51l-104 221c-3 6-8 11-14 15-6 4-12 5-19 5-7 0-13-1-19-5-6-4-11-9-14-15l-104-221c-6-13-9-30-9-51 0-41 14-75 43-104 28-28 63-42 103-42 40 0 75 14 103 42 29 29 43 63 43 104z"/>
</symbol>
