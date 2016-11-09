function createPoints(points) {//function to create an array of points to be used for polygons or linestrings
	var pArray = [];
	if (points.indexOf(" ") > -1) {//point sets must be separated by a space
		var pList = points.split(" ");
		$.each(pList, function() {
			var xy = this.split(",");
			if (xy.length > 1) {
				var lonlat = new OpenLayers.LonLat(xy[0], xy[1]).transform(defaultProj, googProj);
				pArray.push(new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat));
				coCount++;
			}
		});
	}
	return pArray;
	//Send back the array of points
}


function createPoints2(points2) {//function to create an array of points to be used for polygons or linestrings
	var pArray2 = [];
	if (points2.indexOf(" ") > -1) {//point sets must be separated by a space
		var pList2 = points2.split(" ");
		$.each(pList2, function() {
			var xy2 = this.split(",");
			if (xy2.length > 1) {
				var lonlat2 = new OpenLayers.LonLat(xy2[0], xy2[1]).transform(defaultProj, googProj);
				pArray2.push(new OpenLayers.Geometry.Point(lonlat2.lon, lonlat2.lat));
				coCount2++;
			}
		});
	}
	return pArray2;
	//Send back the array of points
}

function silentErrorHandler() {
	return true
}

function Map_Done() {

	Qva.AddExtension("qlikmapmultilayer", function() {
		function onFeatureSelect(f) {//this function handles the selection of the map features
			$.each(f, function() {
				if ($.inArray(this.attributes.rName, cF) === -1) {
					cF.push(this.attributes.rName.toString());
					//add the name of this feature to the cF array
				}
			});
			_this.Data.SelectTextsInColumn(0, false, cF);
			//search in QlikView for all of the selected features
		}

		maxVal = 0;
		maxVal2 = 0;
		var _this = this;
		//set this to _this in order to avoid confusion/conflicts with other processes which ahve their own "this"

		var divName = _this.Layout.ObjectId.replace("\\", "_");
		if (window["h" + divName] && window["h" + divName] != _this.GetHeight()) {
			$("#" + divName).remove()
		}
		if (window["w" + divName] && window["w" + divName] != _this.GetWidth()) {
			$("#" + divName).remove()
		}
		// create unique div name to support multiple instances of this same extension
		//console.info("q" + divName);
		if (_this.Element.children.length == 0) {//if this div doesn't already exist, create a unique div with the divName
			var ui = document.createElement("div");
			ui.setAttribute("id", divName);
			ui.setAttribute("class", "mapC");
			_this.Element.appendChild(ui);
			$("#" + divName).css("height", _this.GetHeight() + "px").css("width", _this.GetWidth() + "px");
		} else {
			$("#" + divName).empty();
			//if it does exist, empty it
		}

		window["h" + divName] = _this.GetHeight();
		window["w" + divName] = _this.GetWidth();
		$("#hoverBox").remove();
		$("#" + divName).unbind("hover");

		var r, i;
		$("#" + divName).mousemove(function(e) {
			r = e.clientX;
			i = e.clientY
		});

		//Create hover box
		$("body").append('<div class="arrowDown" id="hoverBox"><p></p></div>');
		//change the map projection to support the google map type projection which is what OSM uses
		googProj = new OpenLayers.Projection("EPSG:900913");
		defaultProj = new OpenLayers.Projection("EPSG:4326");
		var mapName = "map" + divName;
		var cF = [];
		// array of features to use in searching in QlikView
		var lineO = _this.Layout.Text1.text.toString();
		//default line opacity
		var lcsize = _this.Layout.Text0.text.toString();
		//maximum line and point size
		window["cC" + divName] = _this.Layout.Text2.text.toString();
		//checkbox for using alternate tileset.  if set, use the variable on the next line
		window["cT" + divName] = _this.Layout.Text3.text.toString();
		//url to alternate tileset to use instead of the default

		//Create the map
		window[mapName] = new OpenLayers.Map(divName, {
			controls : [new OpenLayers.Control.Navigation, new OpenLayers.Control.ZoomPanel, new OpenLayers.Control.Attribution],
			projection : googProj,
			units : "m",
			maxResolution : 156543.0399
		});

		//if alternate tileset is being used, create BASE layer with that tileset, otherwise use the Mapquest Open Default
		if (window["cC" + divName] != 0 && window["cT" + divName] != "" && window["cT" + divName] != "-" && window["cC" + divName]) {
			var layerOSM = new OpenLayers.Layer.OSM("BASE", window["cT" + divName])
		} else {
			var layerOSM = new OpenLayers.Layer.OSM("BASE")
		}
		//Modify the box selection tool
		OpenLayers.Control.SelectFeature.prototype.selectBox = function(position) {//write over the default select box functionality for openlayers which zooms instead of selects features.
			if ( position instanceof OpenLayers.Bounds) {
				var minXY = this.map.getLonLatFromPixel(new OpenLayers.Pixel(position.left, position.bottom));
				var maxXY = this.map.getLonLatFromPixel(new OpenLayers.Pixel(position.right, position.top));
				var bounds = new OpenLayers.Bounds(minXY.lon, minXY.lat, maxXY.lon, maxXY.lat);
				// if multiple is false, first deselect currently selected features
				if (!this.multipleSelect()) {
					this.unselectAll();
				}
				// because we're using a box, we consider we want multiple selection
				var prevMultiple = this.multiple;
				this.multiple = true;
				var layers = this.layers || [this.layer];
				var layer;
				var selectedFeatures = [];
				// <-- Modification of original function (1/3)
				for (var l = 0; l < layers.length; ++l) {
					layer = layers[l];
					for (var i = 0, len = layer.features.length; i < len; ++i) {
						var feature = layer.features[i];
						// check if the feature is displayed
						if (!feature.getVisibility()) {
							continue;
						}

						if (this.geometryTypes == null || OpenLayers.Util.indexOf(this.geometryTypes, feature.geometry.CLASS_NAME) > -1) {
							if (bounds.toGeometry().intersects(feature.geometry)) {
								if (OpenLayers.Util.indexOf(layer.selectedFeatures, feature) == -1) {
									this.select(feature);
									selectedFeatures.push(feature);
									// <-- Modification of original function (2/3)
								}
							}
						}
					}
				}
				onFeatureSelect(selectedFeatures);
				// <-- Modification of original function (3/3)
				this.multiple = prevMultiple;
			}
		}
		OpenLayers.Control.SelectFeature.prototype.clickFeature = function(t) {
			_this.Data.SelectTextsInColumn(0, false, t.attributes.rName)
		};

		//create the layer which we'll use to display our features
		var layerVector;
		layerVector = new OpenLayers.Layer.Vector("Regions", {
			//add a listener to the features to show the popup box
			eventListeners : {
				featureselected : function(e) {
					if (e.feature.data.rPop != "" && e.feature.data.rPop != "-" && e.feature.data.rPop != " ") {
						$("#hoverBox p").html(e.feature.data.rPop);
						$("#hoverBox").show()
					}
				},
				featureunselected : function(e) {
					$("#hoverBox").hide()
				}
			}
		});
		window[mapName].events.register("mousemove", layerVector, function(e) {
			$("#hoverBox").css("top", e.clientY - 15 + "px").css("left", e.clientX + 30 + "px")
		});
		//array of features
		fArray = [];
		//collection of features that we'll add to the layer
		var fCollection = new OpenLayers.Geometry.Collection();
		//collection of geometric features
		var gCollection = [];
		//create JSON object to hold all of the regional polygons
		var rArr = {};
		//create JSON object to hold all of the points
		var pArr = {};
		//create JSON object to hold all of the linestrings
		var sArr = {};
		//flag which is set to 1 later if the size/shade of the features are being hardcoded
		var hcFlag = 0;
		
				
		
		for (var rowIx = 0; rowIx < _this.Data.Rows.length; rowIx++) {//loop throught the data from QlikView
			
			var row = _this.Data.Rows[rowIx];
			//feature name
			var thisR = row[0].text;
			//pop up contents
			var popUpText = row[6].text; //4-6
			//feature coordinates
			var thisC = row[1].text;
			if (thisC) {
				//percentage number
				var perNum = -1;
				if (row[4].text.indexOf("px") > -1) {//if the user has set the value to a hardcoded pixel, then they're hardcoding
					hcFlag = 1
				} else if (row[4].text != "-" && row[4].text != " " && row[4].text != "") {//otherwise...
					perNum = parseFloat(row[4].text);
					hcFlag = 0
				}
				//id
				thisR = thisR.toUpperCase();
				//true value of the region to use for search, etc.
				var rN = row[0].text;
				//set the id value to prepend with an r in case the name is a number
				thisR = "r" + thisR + divName;
				if (thisC.indexOf("\n") > -1 || thisC.indexOf("\r") > -1 || thisC.indexOf("\r\n") > -1) { //if the coordinates contain line breaks...
					//replace those with spaces
					thisC = thisC.replace(/(\r\n|\n|\r)/gm, " ")
				}
				//trim off the beginning and ending white space
				thisC = $.trim(thisC);
				if (thisC.split(" ").length > 1) { //if there's more than one, it's a line or polygon
					if (thisC.split(" ")[0] != thisC.split(" ")[thisC.split(" ").length - 1]) {//check if it's a line or a polygon
						//it's a line string
						if (sArr[thisR]) { //if an entry already exists for this region in the JSON object, add new coordinates
							var thisNew;
							if (cCache[thisR]) {
								thisNew = ""
							} else {
								thisNew = createPoints(thisC)
							}
							//adding new coordinates
							sArr[thisR].cArr.push(thisNew);
							if (hcFlag === 0) {
								if (perNum != "-" && perNum != " " && perNum != "" && perNum != -1) {//if current value is larger than the max, set the max to this value
									if (perNum > maxValS) {
										maxValS = perNum
									}
									if (!sArr[thisR].rPercent) {//if this region doesn't currently have a percentage, set it to one
										sArr[thisR].rPercent = perNum
									}
								}
							} else {//if values are hardcoded set them that way
								if (!rArr[thisR].rPercent && perNum != -1) {
									sArr[thisR].rPercent = row[4].text
								}
							}
						} else { //entry doesn't already exist
							var tArr = [];
							var thisNew;
							if (cCache[thisR]) {
								thisNew = ""
							} else {
								thisNew = createPoints(thisC)
							}
							tArr.push(thisNew);
							//create new feature entry with the appropriate data
							sArr[thisR] = {
								clean : thisR,
								tName : rN,
								cArr : tArr,
								pop : popUpText,
								rPercent : row[4].text,
								rColor : colorFormatter(row[5].text)
							};
							if (sArr[thisR].rPercent && hcFlag === 0) {
								if (perNum > maxValS) {//if current value is larger than the max, set the max to this value
									maxValS = perNum
								}
							}
						}
					} else {
						//it's a polygon
						if (rArr[thisR]) {//if an entry already exists...
							var thisNew;
							if (cCache[thisR]) {
								thisNew = ""
							} else {
								thisNew = createPoints(thisC)
							}
							rArr[thisR].cArr.push(thisNew);
							if (valCheck.length < 2 && $.inArray(perNum, valCheck) > -1) {
								valCheck.push(perNum)
							}
							if (perNum != "-" && perNum != " " && perNum != "" && hcFlag === 0 && perNum != -1) {
								if (perNum > maxVal) {
									maxVal = perNum
								}
							}
							if (!rArr[thisR].rPercent && perNum != -1) {
								rArr[thisR].rPercent = row[4].text
							}
						} else { //if not...
							var tArr = [];
							var thisNew;
							if (cCache[thisR]) {
								thisNew = ""
							} else {
								thisNew = createPoints(thisC)
							}
							tArr.push(thisNew);
							if (row[4].text != "-" && row[4].text != " " && row[4].text != "") {
								tNum = row[4].text
							} else {
								tNum = 0
							}
							rArr[thisR] = {
								clean : thisR,
								tName : rN,
								cArr : tArr,
								pop : popUpText,
								rPercent : tNum,
								rColor : colorFormatter(row[5].text)
							};
							if (valCheck.length < 2 && $.inArray(perNum, valCheck) > 1) {
								if (!$.inArray(perNum, valCheck)) {
									valCheck.push(perNum)
								}
							}
							if (rArr[thisR].rPercent && hcFlag === 0) {
								if (perNum > maxVal) {
									maxVal = perNum
								}
							}
						}
					}
				} else {
					//plot points
					if (pArr[thisR]) {
						var xy = thisC.split(",");
						if (xy.length > 1) {
							if (cCache[thisR]) {
								var tPoint = ""
							} else {
								//add point to array of points
								var lonlat = (new OpenLayers.LonLat(xy[0], xy[1])).transform(defaultProj, googProj);
								var tPoint = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)
							}
							pArr[thisR].cArr.push(tPoint);
							if (perNum != "-" && perNum != " " && perNum != "" && hcFlag === 0 && perNum != -1) {
								if (perNum > maxValP) {
									maxValP = perNum
								}
							}
							if (!pArr[thisR].rPercent && perNum != -1) {
								pArr[thisR].rPercent = row[4].text
							}
						}
					} else {
						var xy = thisC.split(",");
						if (xy.length > 1) {
							var tArr = [];
							if (cCache[thisR]) {
								var tPoint = ""
							} else {
								//add point to array of points
								var lonlat = (new OpenLayers.LonLat(xy[0], xy[1])).transform(defaultProj, googProj);
								var tPoint = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)
							}
							tArr.push(tPoint);
							pArr[thisR] = {
								clean : thisR,
								tName : rN,
								cArr : tArr,
								pop : popUpText,
								rPercent : row[4].text,
								rColor : colorFormatter(row[5].text)
							};
							if (pArr[thisR].rPercent && hcFlag === 0) {
								if (perNum > maxValP) {
									maxValP = perNum
								}
							}
						}
					}
				}
			} 
		} 
		$.each(rArr, function() {//loop through regions
		
			var lArr = [];
			var rObj = this;
			lArr = this.cArr;
			if (valCheck.length === 1) { //set regPercent to the percentage
				var regPercent = lineO;
			} else if (rObj.rPercent.indexOf("px") > -1 && rObj.rPercent.indexOf(",") === -1) {//if line width is hardcoded but not region, set the opacity to .9
				var regPercent = .9
			} else if (rObj.rPercent.indexOf("px") > -1 && rObj.rPercent.indexOf(",") > -1) {//else if it's hardcoded and the percentage is there
				var regPercent = rObj.rPercent.substring(rObj.rPercent.indexOf(",") + 1, rObj.rPercent.indexOf("%"));
				regPercent = regPercent * .01
			} else {//otherwise just use the data
				var regPercent = parseFloat(rObj.rPercent) / maxVal * .9
			}
			if (cCache[rObj.clean]) {
				
				if ($.isArray(cCache[rObj.clean].geom)) {
					$.each(cCache[rObj.clean].geom, function() {
						var feature_polygon = new OpenLayers.Feature.Vector(this, { //We'll make a polygon from a linear ring object, which consists of points
							rName : rObj.tName,
							rPop : rObj.pop
						}, {
							fillColor : rObj.rColor,
							strokeWidth : borderWidth,
							strokeColor : rObj.rColor,
							fillOpacity : regPercent
						});
						fArray.push(feature_polygon);
						gCollection.push(this)
					})
				} else {
					var feature_polygon = new OpenLayers.Feature.Vector(//We'll make a polygon from a linear ring object, which consists of points
					cCache[rObj.clean].geom, {
						rName : rObj.tName,
						rPop : rObj.pop
					}, {
						fillColor : rObj.rColor,
						strokeWidth : borderWidth,
						strokeColor : rObj.rColor,
						fillOpacity : regPercent
					});
					fArray.push(feature_polygon);
					gCollection.push(cCache[rObj.clean].geom)
				}
			} else {
				$.each(lArr, function() {//loop through polygons associated with that region
					var tempGeo = new OpenLayers.Geometry.Polygon(new OpenLayers.Geometry.LinearRing(this));
					if (cCache[rObj.clean]) {
						var tempArr = [];
						if (!$.isArray(cCache[rObj.clean].geom)) {
							tempArr.push(cCache[rObj.clean].geom);
							tempArr.push(tempGeo);
							cCache[rObj.clean].geom = tempArr
						} else {
							cCache[rObj.clean].geom.push(tempGeo)
						}
					} else {
						cCache[rObj.clean] = {
							rName : rObj.tName,
							rPop : rObj.pop,
							geom : tempGeo
						}
					}
					var feature_polygon = new OpenLayers.Feature.Vector(tempGeo, {//We'll make a polygon from a linear ring object, which consists of points
						rName : rObj.tName,
						rPop : rObj.pop
					}, {
						fillColor : rObj.rColor,
						strokeWidth : borderWidth,
						strokeColor : rObj.rColor,
						fillOpacity : regPercent
					});
					fArray.push(feature_polygon);
					gCollection.push(tempGeo)
				})
			}
		});
		$.each(pArr, function() {//loop through points
			var lArr = [];
			var rObj = this;
			lArr = this.cArr;
			
			var regOp = lineO;
			if (rObj.rPercent.indexOf("px") > -1) {
				var regPercent = rObj.rPercent.substring(0, rObj.rPercent.indexOf("px"));
				regOp = .7
			} else {
				var regPercent = parseFloat(rObj.rPercent) / maxValP * lcsize
			}
			if (cCache[rObj.clean]) {
				if ($.isArray(cCache[rObj.clean].geom)) {
					$.each(cCache[rObj.clean].geom, function() {
						var feature_point = new OpenLayers.Feature.Vector(//create the actual point on the vector layer
						this, {
							rName : rObj.tName,
							rPop : rObj.pop
						}, {
							fillColor : rObj.rColor,
							strokeWidth : borderWidth,
							strokeColor : rObj.rColor,
							fillOpacity : regOp,
							pointRadius : regPercent
						});
						fArray.push(feature_point);
						gCollection.push(this)
					})
				} else {
					var feature_point = new OpenLayers.Feature.Vector(//create the actual point on the vector layer
					cCache[rObj.clean].geom, {
						rName : rObj.tName,
						rPop : rObj.pop
					}, {
						fillColor : rObj.rColor,
						strokeWidth : borderWidth,
						strokeColor : rObj.rColor,
						fillOpacity : regOp,
						pointRadius : regPercent
					});
					fArray.push(feature_point);
					gCollection.push(cCache[rObj.clean].geom)
				}
			} else {
				$.each(lArr, function() { //if hardcoded, set the size to the hardcoded value and the opacity to .7
					if (cCache[rObj.clean]) {
						var tempArr = [];
						if (!$.isArray(cCache[rObj.clean].geom)) {
							tempArr.push(cCache[rObj.clean].geom);
							tempArr.push(this);
							cCache[rObj.clean].geom = tempArr
						} else {
							cCache[rObj.clean].geom.push(this)
						}
					} else {
						cCache[rObj.clean] = {
							rName : rObj.tName,
							rPop : rObj.pop,
							geom : this
						}
					}
					var feature_point = new OpenLayers.Feature.Vector(
					this, {
						rName : rObj.tName,
						rPop : rObj.pop
					}, {
						fillColor : rObj.rColor,
						strokeWidth : borderWidth,
						strokeColor : rObj.rColor,
						fillOpacity : regOp,
						pointRadius : regPercent
					});
					fArray.push(feature_point);
					gCollection.push(this)
					
				})
			} 	
		});
		$.each(sArr, function() {//loop through linestrings
			var lArr = [];
			var rObj = this;
			lArr = this.cArr;
			if (rObj.rPercent.indexOf("px") > -1) {
				var regPercent = rObj.rPercent.substring(0, rObj.rPercent.indexOf("px"))
			} else {
				var regPercent = rObj.rPercent / maxValS * lcsize
			}
			if (cCache[rObj.clean]) {
				if ($.isArray(cCache[rObj.clean].geom)) {
					$.each(cCache[rObj.clean].geom, function() {
						var feature_string = new OpenLayers.Feature.Vector(//We'll make a polygon from a linear ring object, which consists of points
						this, {
							rName : rObj.tName,
							rPop : rObj.pop
						}, {
							strokeWidth : regPercent,
							strokeColor : rObj.rColor,
							strokeOpacity : lineO
						});
						fArray.push(feature_string);
						gCollection.push(this)
					})
				} else {
					var feature_string = new OpenLayers.Feature.Vector(//We'll make a polygon from a linear ring object, which consists of points
						cCache[rObj.clean].geom, {
						rName : rObj.tName,
						rPop : rObj.pop
					}, {
						strokeWidth : regPercent,
						strokeColor : rObj.rColor,
						strokeOpacity : lineO
					});
					fArray.push(feature_string);
					gCollection.push(cCache[rObj.clean].geom)
				}
			} else {
				$.each(lArr, function() {
					var tempGeo = new OpenLayers.Geometry.LineString(this);
					if (cCache[rObj.clean]) {
						var tempArr = [];
						if (!$.isArray(cCache[rObj.clean].geom)) {
							tempArr.push(cCache[rObj.clean].geom);
							tempArr.push(tempGeo);
							cCache[rObj.clean].geom = tempArr
						} else {
							cCache[rObj.clean].geom.push(tempGeo)
						}
					} else {
						cCache[rObj.clean] = {
							rName : rObj.tName,
							rPop : rObj.pop,
							geom : tempGeo
						}
					}
					var feature_string = new OpenLayers.Feature.Vector(tempGeo, {//create the linestring
						rName : rObj.tName,
						rPop : rObj.pop
					}, {
						strokeWidth : regPercent,
						strokeColor : rObj.rColor,
						strokeOpacity : lineO
					});
					fArray.push(feature_string);
					gCollection.push(tempGeo)
				})
			}
		});
		
	
/*******************************************************************************************************/

//OK lets see if this works for adding a new layer.........

//create the layer which we'll use to display our features
		var layerVector2;
		layerVector2 = new OpenLayers.Layer.Vector("Regions", {
			
			//add a listener to the features to show the popup box
			eventListeners : {
				featureselected : function(e) {
					if (e.feature.data.rPop != "" && e.feature.data.rPop != "-" && e.feature.data.rPop != " ") {
						$("#hoverBox p").html(e.feature.data.rPop);
						$("#hoverBox").show()
					}
				},
				featureunselected : function(e) {
					$("#hoverBox").hide()
				}
			}
		});
		window[mapName].events.register("mousemove", layerVector2, function(e) {
			$("#hoverBox").css("top", e.clientY - 15 + "px").css("left", e.clientX + 30 + "px")
		});
		//array of features
		fArray2 = [];
		//collection of features that we'll add to the layer
		var fCollection2 = new OpenLayers.Geometry.Collection();
		//collection of geometric features
		var gCollection2 = [];
		//create JSON object to hold all of the regional polygons
		var rArr2 = {};
		//create JSON object to hold all of the points
		var pArr2 = {};
		//create JSON object to hold all of the linestrings
		var sArr2 = {};
		//flag which is set to 1 later if the size/shade of the features are being hardcoded
		var hcFlag2 = 0;
		
				
		
		for (var rowIx2 = 0; rowIx2 < _this.Data.Rows.length; rowIx2++) {//loop throught the data from QlikView

			var row2 = _this.Data.Rows[rowIx2];
			//feature name
			var thisR2 = row2[2].text;
			//pop up contents
			var popUpText2 = row2[9].text; //4-6
			//feature coordinates
			var thisC2 = row2[3].text;
			if (thisC2) {
				//percentage number
				var perNum2 = -1;
				if (row2[7].text.indexOf("px") > -1) {//if the user has set the value to a hardcoded pixel, then they're hardcoding
					hcFlag2 = 1
				} else if (row2[7].text != "-" && row2[7].text != " " && row2[7].text != "") {//otherwise...
					perNum2 = parseFloat(row2[7].text);
					hcFlag2 = 0
				}
				//id
				thisR2 = thisR2.toUpperCase();
				//true value of the region to use for search, etc.
				var rN2 = row2[2].text;
				//set the id value to prepend with an r in case the name is a number
				thisR2 = "r" + thisR2 + divName;
				if (thisC2.indexOf("\n") > -1 || thisC2.indexOf("\r") > -1 || thisC2.indexOf("\r\n") > -1) { //if the coordinates contain line breaks...
					//replace those with spaces
					thisC2 = thisC2.replace(/(\r\n|\n|\r)/gm, " ")
				}
				//trim off the beginning and ending white space
				thisC2 = $.trim(thisC2);
			
				if (thisC2.split(" ").length > 1) { 	//if there's more than one, it's a line or polygon
					if (thisC2.split(" ")[0] != thisC2.split(" ")[thisC2.split(" ").length - 1]) {//check if it's a line or a polygon
						//it's a line string
						if (sArr2[thisR2]) { //if an entry already exists for this region in the JSON object, add new coordinates
							var thisNew2;
							if (cCache2[thisR2]) {
								thisNew2 = ""
							} else { 
								thisNew2 = createPoints2(thisC2)
							}
							//adding new coordinates
							sArr2[thisR2].cArr.push(thisNew2);
							if (hcFlag2 === 0) {
								if (perNum2 != "-" && perNum2 != " " && perNum2 != "" && perNum2 != -1) {//if current value is larger than the max, set the max to this value
									if (perNum2 > maxVal2S2) {
										maxVal2S2 = perNum2
									}
									if (!sArr2[thisR2].rPercent) {//if this region doesn't currently have a percentage, set it to one
										sArr2[thisR2].rPercent = perNum2
									}
								}
							} else {//if values are hardcoded set them that way
								if (!rArr2[thisR2].rPercent && perNum2 != -1) {
									sArr2[thisR2].rPercent = row2[7].text
								}
							}
						} else { //entry doesn't already exist
							var tArr2 = [];
							var thisNew2;
							if (cCache2[thisR2]) {
								thisNew2 = ""
							} else {
								thisNew2 = createPoints2(thisC2)
							}
							tArr2.push(thisNew2);
							//create new feature entry with the appropriate data
							sArr2[thisR2] = {
								clean : thisR2,
								tName : rN2,
								cArr : tArr2,
								pop : popUpText2,
								rPercent : row2[7].text,
								rColor : colorFormatter(row2[8].text)
							};
							if (sArr2[thisR2].rPercent && hcFlag2 === 0) {
								if (perNum2 > maxVal2S2) {//if current value is larger than the max, set the max to this value
									maxVal2S2 = perNum2
								}
							}
						}
					} else {
						//it's a polygon
						if (rArr2[thisR2]) {//if an entry already exists...
							var thisNew2;
							if (cCache2[thisR2]) {
								thisNew2 = ""
							} else {
								thisNew2 = createPoints2(thisC2)
							}
							rArr2[thisR2].cArr.push(thisNew2);
							if (valCheck.length < 2 && $.inArray(perNum2, valCheck) > -1) {
								valCheck.push(perNum2)
							}
							if (perNum2 != "-" && perNum2 != " " && perNum2 != "" && hcFlag2 === 0 && perNum2 != -1) {
								if (perNum2 > maxVal2) {
									maxVal2 = perNum2
								}
							}
							if (!rArr2[thisR2].rPercent && perNum2 != -1) {
								rArr2[thisR2].rPercent = row2[7].text
							}
						} else { //if not...
							var tArr2 = [];
							var thisNew2;
							if (cCache2[thisR2]) {
								thisNew2 = ""
							} else {
								thisNew2 = createPoints2(thisC2)
							}
							tArr2.push(thisNew2);
							if (row2[7].text != "-" && row2[7].text != " " && row2[7].text != "") {
								tNum2 = row2[7].text
							} else {
								tNum2 = 0
							}
							rArr2[thisR2] = {
								clean : thisR2,
								tName : rN2,
								cArr : tArr2,
								pop : popUpText2,
								rPercent : tNum2,
								rColor : colorFormatter(row2[8].text)
							};
							if (valCheck.length < 2 && $.inArray(perNum2, valCheck) > 1) {
								if (!$.inArray(perNum2, valCheck)) {
									valCheck.push(perNum2)
								}
							}
							if (rArr2[thisR2].rPercent && hcFlag2 === 0) {
								if (perNum2 > maxVal2) {
									maxVal2 = perNum2
								}
							}
						}
					}
				} else { 
					//plot points
					if (pArr2[thisR2]) {
						var xy2 = thisC2.split(",");
						if (xy2.length > 1) {  
							if (cCache2[thisR2]) {
								var tPoint2 = ""
							} else { 
								//add point to array of points
								var lonlat2 = (new OpenLayers.LonLat(xy2[0], xy2[1])).transform(defaultProj, googProj);
								var tPoint2 = new OpenLayers.Geometry.Point(lonlat2.lon, lonlat2.lat)
							}
							pArr2[thisR2].cArr.push(tPoint2);
							if (perNum2 != "-" && perNum2 != " " && perNum2 != "" && hcFlag2 === 0 && perNum2 != -1) {
								if (perNum2 > maxValP2) {
									maxValP2 = perNum2
								}
							}
							if (!pArr2[thisR2].rPercent && perNum2 != -1) {
								pArr2[thisR2].rPercent = row2[7].text
							}
						}
					} else { 
						var xy2 = thisC2.split(",");
						if (xy2.length > 1) {
							var tArr2 = [];
							if (cCache2[thisR2]) {
								var tPoint2 = ""
							} else {  
								//add point to array of points
								var lonlat2 = (new OpenLayers.LonLat(xy2[0], xy2[1])).transform(defaultProj, googProj);
								
								var tPoint2 = new OpenLayers.Geometry.Point(lonlat2.lon, lonlat2.lat)
								
							} 
							
							tArr2.push(tPoint2);
							pArr2[thisR2] = {
								clean : thisR2,
								tName : rN2,
								cArr : tArr2,
								pop : popUpText2,
								rPercent : row2[7].text,
								rColor : colorFormatter(row2[8].text)
							};
							
							if (pArr2[thisR2].rPercent && hcFlag2 === 0) { 
								if (perNum2 > maxValP2) { 
									maxValP2 = perNum2
								}
							}
						}
					}
				}
			} 
		} 
			
		$.each(rArr2, function() {//loop through regions 
		
			var lArr2= [];
			var rObj2 = this;
			lArr2 = this.cArr;
			
			if (valCheck.length === 1) { //set regPercent2to the percentage
				var regPercent2= lineO;
			} else if (rObj2.rPercent.indexOf("px") > -1 && rObj2.rPercent.indexOf(",") === -1) {//if line width is hardcoded but not region, set the opacity to .9
				var regPercent2= .9
			} else if (rObj2.rPercent.indexOf("px") > -1 && rObj2.rPercent.indexOf(",") > -1) {//else if it's hardcoded and the percentage is there
				var regPercent2= rObj2.rPercent.substring(rObj2.rPercent.indexOf(",") + 1, rObj2.rPercent.indexOf("%"));
				regPercent2 = regPercent2* .01
			} else {//otherwise just use the data
				var regPercent2= parseFloat(rObj2.rPercent) / maxVal2 * .9
			}
			if (cCache2[rObj2.clean]) {
				
				if ($.isArray(cCache2[rObj2.clean].geom)) {
					$.each(cCache2[rObj2.clean].geom, function() {
						var feature_polygon2 = new OpenLayers.Feature.Vector(this, { //We'll make a polygon from a linear ring object, which consists of points
							rName : rObj2.tName,
							rPop : rObj2.pop
						}, {
							fillColor : rObj2.rColor,
							strokeWidth : borderWidth,
							strokeColor : rObj2.rColor,
							fillOpacity : regPercent
						});
						fArray2.push(feature_polygon2);
						gCollection2.push(this)
					})
				} else {
					var feature_polygon2 = new OpenLayers.Feature.Vector(//We'll make a polygon from a linear ring object, which consists of points
					cCache2[rObj2.clean].geom, {
						rName : rObj2.tName,
						rPop : rObj2.pop
					}, {
						fillColor : rObj2.rColor,
						strokeWidth : borderWidth,
						strokeColor : rObj2.rColor,
						fillOpacity : regPercent
					});
					fArray2.push(feature_polygon2);
					gCollection2.push(cCache2[rObj2.clean].geom)
				}
			} else {
				$.each(lArr2, function() {//loop through polygons associated with that region
					var tempGeo2 = new OpenLayers.Geometry.Polygon(new OpenLayers.Geometry.LinearRing(this));
					if (cCache2[rObj2.clean]) {
						var tempArr2 = [];
						if (!$.isArray(cCache2[rObj2.clean].geom)) {
							tempArr2.push(cCache2[rObj2.clean].geom);
							tempArr2.push(tempGeo2);
							cCache2[rObj2.clean].geom = tempArr2
						} else {
							cCache2[rObj2.clean].geom.push(tempGeo2)
						}
					} else {
						cCache2[rObj2.clean] = {
							rName : rObj2.tName,
							rPop : rObj2.pop,
							geom : tempGeo2
						}
					}
					var feature_polygon2 = new OpenLayers.Feature.Vector(tempGeo2, {//We'll make a polygon from a linear ring object, which consists of points
						rName : rObj2.tName,
						rPop : rObj2.pop
					}, {
						fillColor : rObj2.rColor,
						strokeWidth : borderWidth,
						strokeColor : rObj2.rColor,
						fillOpacity : regPercent
					});
					fArray2.push(feature_polygon2);
					gCollection2.push(tempGeo2)
				})
			}
		});
		

		
		$.each(pArr2, function() {//loop through points

			var lArr2= [];
			var rObj2 = this;
			lArr2 = this.cArr;
			
			var regOp2 = lineO;
			if (rObj2.rPercent.indexOf("px") > -1) { 	
				var regPercent2= rObj2.rPercent.substring(0, rObj2.rPercent.indexOf("px"));
				regOp2 = .7
			} else {
				var regPercent2= parseFloat(rObj2.rPercent) / maxValP2 * lcsize
			}
			if (cCache2[rObj2.clean]) { 
				if ($.isArray(cCache2[rObj2.clean].geom)) {
					$.each(cCache2[rObj2.clean].geom, function() {
						var feature_point2 = new OpenLayers.Feature.Vector(//create the actual point on the vector layer
						this, {
							rName : rObj2.tName,
							rPop : rObj2.pop
						}, {
							fillColor : rObj2.rColor,
							strokeWidth : borderWidth,
							strokeColor : rObj2.rColor,
							fillOpacity : regOp2,
							pointRadius : regPercent
						});
						fArray2.push(feature_point2);
						gCollection2.push(this)
					})
				} else {
					var feature_point2 = new OpenLayers.Feature.Vector(//create the actual point on the vector layer
					cCache2[rObj2.clean].geom, {
						rName : rObj2.tName,
						rPop : rObj2.pop
					}, {
						fillColor : rObj2.rColor,
						strokeWidth : borderWidth,
						strokeColor : rObj2.rColor,
						fillOpacity : regOp2,
						pointRadius : regPercent
					});
					fArray2.push(feature_point2);
					gCollection2.push(cCache2[rObj2.clean].geom)
				}
			} else {  
				$.each(lArr2, function() {//if hardcoded, set the size to the hardcoded value and the opacity to .7
					if (cCache2[rObj2.clean]) { 
						var tempArr2 = [];
						if (!$.isArray(cCache2[rObj2.clean].geom)) { 
							tempArr2.push(cCache2[rObj2.clean].geom);
							tempArr2.push(this);
							cCache2[rObj2.clean].geom = tempArr2
						} else {
							cCache2[rObj2.clean].geom.push(this)
						}
					} else { 
						cCache2[rObj2.clean] = {
							rName : rObj2.tName,
							rPop : rObj2.pop,
							geom : this
						}
					} 
					var feature_point2 = new OpenLayers.Feature.Vector(
					this, {
						rName : rObj2.tName,
						rPop : rObj2.pop
					}, {
						fillColor : rObj2.rColor,
						strokeWidth : borderWidth,
						strokeColor : rObj2.rColor,
						fillOpacity : regOp2,
						pointRadius : regPercent2
					}); 
					fArray2.push(feature_point2);
					gCollection2.push(this)
						
					//seems to be failing after this point for some reason?!
				}) 
			} 
			
		});
		
		

		$.each(sArr2, function() {//loop through linestrings
			var lArr2= [];
			var rObj2 = this;
			lArr2 = this.cArr;
			if (rObj2.rPercent.indexOf("px") > -1) {
				var regPercent2= rObj2.rPercent.substring(0, rObj2.rPercent.indexOf("px"))
			} else {
				var regPercent2= rObj2.rPercent / maxVal2S2 * lcsize
			}
			if (cCache2[rObj2.clean]) {
				if ($.isArray(cCache2[rObj2.clean].geom)) {
					$.each(cCache2[rObj2.clean].geom, function() {
						var feature_string2 = new OpenLayers.Feature.Vector(//We'll make a polygon from a linear ring object, which consists of points
						this, {
							rName : rObj2.tName,
							rPop : rObj2.pop
						}, {
							strokeWidth : regPercent,
							strokeColor : rObj2.rColor,
							strokeOpacity : lineO
						});
						fArray2.push(feature_string2);
						gCollection2.push(this)
					})
				} else {
					var feature_string2 = new OpenLayers.Feature.Vector(//We'll make a polygon from a linear ring object, which consists of points
						cCache2[rObj2.clean].geom, {
						rName : rObj2.tName,
						rPop : rObj2.pop
					}, {
						strokeWidth : regPercent,
						strokeColor : rObj2.rColor,
						strokeOpacity : lineO
					});
					fArray2.push(feature_string2);
					gCollection2.push(cCache2[rObj2.clean].geom)
				}
			} else {
				$.each(lArr2, function() {
					var tempGeo2 = new OpenLayers.Geometry.LineString(this);
					if (cCache2[rObj2.clean]) {
						var tempArr2 = [];
						if (!$.isArray(cCache2[rObj2.clean].geom)) {
							tempArr2.push(cCache2[rObj2.clean].geom);
							tempArr2.push(tempGeo2);
							cCache2[rObj2.clean].geom = tempArr2
						} else {
							cCache2[rObj2.clean].geom.push(tempGeo2)
						}
					} else {
						cCache2[rObj2.clean] = {
							rName : rObj2.tName,
							rPop : rObj2.pop,
							geom : tempGeo2
						}
					}
					var feature_string2 = new OpenLayers.Feature.Vector(tempGeo2, {//create the linestring
						rName : rObj2.tName,
						rPop : rObj2.pop
					}, {
						strokeWidth : regPercent,
						strokeColor : rObj2.rColor,
						strokeOpacity : lineO
					});
					fArray2.push(feature_string2);
					gCollection2.push(tempGeo2)
				})
			}
		});

	
/*******************************************************************************************************/		
		
		window[mapName].addLayer(layerOSM);
		if (fArray.length > 0) {
		
			//add features to the layer
			layerVector.addFeatures(fArray);
			layerVector2.addFeatures(fArray2);
			//add all of the features to the feature collection
			fCollection.addComponents(gCollection);
			fCollection2.addComponents(gCollection2);
			window[mapName].addLayer(layerVector);
			window[mapName].addLayer(layerVector2);
			//find out the bounding box of the features	
			var zoomTo = layerVector.getDataExtent();
			//zoom map to those boundaries
			window[mapName].zoomToExtent(zoomTo);
			//add control to handle selection of features
			var selectCtrl = new OpenLayers.Control.SelectFeature(layerVector, {
				clickout : true,
				box : true,
				hover : true
			});

			//set up the modified box drawing
			selectCtrl.handlers.box.keyMask = OpenLayers.Handler.MOD_SHIFT;
			selectCtrl.handlers.box.dragHandler.keyMask = OpenLayers.Handler.MOD_SHIFT;
			//set up the modified box drawing
			window[mapName].addControl(selectCtrl);

			//activate the control
			selectCtrl.activate()

				if (fArray2.length > 0) {
				
			//add features to the layer
				layerVector2.addFeatures(fArray2);
			//add all of the features to the feature collection
				fCollection2.addComponents(gCollection2);
			
			window[mapName].addLayer(layerVector2);
			//find out the bounding box of the features	
			var zoomTo = layerVector.getDataExtent();
			//zoom map to those boundaries
			window[mapName].zoomToExtent(zoomTo);
			//add control to handle selection of features
			var selectCtrl2 = new OpenLayers.Control.SelectFeature(layerVector2, {
				clickout : true,
				box : true,
				hover : true
			});
			//set up the modified box drawing
			selectCtrl.handlers.box.keyMask = OpenLayers.Handler.MOD_SHIFT;
			selectCtrl.handlers.box.dragHandler.keyMask = OpenLayers.Handler.MOD_SHIFT;
			//set up the modified box drawing
			window[mapName].addControl(selectCtrl2);
			//activate the control
			selectCtrl2.activate()
		}
		
		}
		
		//load stylesheet
		Qva.LoadCSS("/QvAjaxZfc/QvsViewClient.aspx?public=only&name=Extensions/qlikmap/style.css");
		//add images to buttons
		$(".olControlZoomInItemInactive").css("background", "url('" + qpath + "more.png') no-repeat top left").css("width", "19px").css("height", "19px");
		$(".olControlZoomOutItemInactive").css("background", "url('" + qpath + "less.png') no-repeat top left").css("width", "19px").css("height", "19px").css("top", "17px");
		coCount = 0
	})
}

var qpath = Qva.Remote + "?public=only&name=Extensions/qlikmap/";
var borderWidth = 1;
if ( typeof jQuery == "undefined") {//if running QV10, load jquery, then load the openlayers library
	Qva.LoadScript("/QvAjaxZfc/QvsViewClient.aspx?public=only&name=Extensions/qlikmap/jquery.js", function() {
		Qva.LoadScript("http://www.openlayers.org/api/OpenLayers.js", Map_Done)
	})
} else {
	Qva.LoadScript("http://www.openlayers.org/api/OpenLayers.js", Map_Done)
}
var cCache = {};
var coCount = 0;
//Maximum values of the region, point, and line measures to be used to determine the size and or opacity of the thing.  All the values will be divided against the maximum
var maxVal = 0;
var valCheck = [];
var maxValP = 0;
var maxValS = 0;

var cCache2 = {};
var coCount2 = 0;
//Maximum values of the region, point, and line measures to be used to determine the size and or opacity of the thing.  All the values will be divided against the maximum
var maxVal2 = 0;
var valCheck2 = [];
var maxValP2 = 0;
var maxValS2 = 0;



colorFormatter = function(c) {//function used to properly format the color that is entered
	var cc = c.toLowerCase();
	if ((cc.indexOf("rgb") === -1) && (cc.indexOf("#") === -1)) {
		if (cc.length < 6) {
			var addIt = "#";
			for (var i = cc.length; i < 6; i++) {
				addIt += "0";
			}
			cc = addIt + cc
		} else {
			cc = "#" + cc;
		}
		return cc;
	} else {
		return cc;
	}
}
var map, googProj, defaultProj;
//to suppress a strange error that was being thrown for an unknown reason despite everything working properly
//window.onerror = silentErrorHandler;
