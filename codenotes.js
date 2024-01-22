
										// I tried to make this work in IE but couldn't
										// Leaving all this MSIE stuff in just in case
										// I feel like trying again later 

	var isIE = (window.navigator.userAgent.indexOf("MSIE") > 0);
   	
	if (document.implementation && document.implementation.createDocument){
		var cnDoc = document.implementation.createDocument("", "", null);
	} else if (window.ActiveXObject){
		var cnDoc = new ActiveXObject("Microsoft.XMLDOM");
	}
	cnDoc.async=false;
	var cnTop = getTop();
	
	// apparently XMLDocument load is gone. Really old shit. cnDoc.load(cnTop);	
	if (typeof window.DOMParser != "undefined") {
		xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", cnTop, false);
		if (xmlhttp.overrideMimeType) {
			xmlhttp.overrideMimeType('text/xml');
		}
		xmlhttp.send();
		cnDoc = xmlhttp.responseXML;
	} else {
		cnDoc = new ActiveXObject("Microsoft.XMLDOM");
		cnDoc.async = "false";
		cnDoc.load(xmlFile);
	}

	var _related = cnDoc.documentElement.getElementsByTagName("related");
	var _artifacts = cnDoc.getElementsByTagName("artifact");
	var _artRefs=[];
	var lineNumber=0;
	
	/*=============================================
	* getArtifactById()
	* ============================================*/

	function getArtifactById (artifacts, artId) {	
	
		for (var a=0; a < artifacts.length; a++) {
			if (artId == artifacts[a].getAttribute("id")){
				return artifacts[a];
			}
		}
	}

	/*=============================================
	* getArtifactByURI()
	* ============================================*/

	function getArtifactByURI (artURI) {

		
		var URI = artURI.split("#");
		var artUrl = URI[0];
		var artId = URI[1];
											// if external doc has already been loaded,
											// we are able to return the artifact
											
		for (var a=0; a < _artRefs.length; a++) {
			if (artUrl == _artRefs[a].url){
				artifact =  getArtifactById (_artRefs[a].artifacts,artId);			
				return artifact;
			}
		}				
											// if external doc not loaded yet, load it
											// and recurse to look again for the artifact 
		loadArtRef(artUrl);			
		return getArtifactByURI(artURI);
	}
	
	
	/*=============================================
	* loadArtRef()
	* ============================================*/

	function loadArtRef(artUrl) {
	
		if (document.implementation && document.implementation.createDocument){
			var doc = document.implementation.createDocument("", "", null);
		} else if (window.ActiveXObject){
			var doc = new ActiveXObject("Microsoft.XMLDOM");
		}
		
		doc.async=false;
		doc.load(artUrl);

		_artRefs[_artRefs.length] = new artRef (artUrl, doc.getElementsByTagName("artifact") );
	}
	
	
	/*=============================================
	* artRef()
	* ============================================*/

	function artRef(artUrl, artifacts) {

		this.url = artUrl;
		this.artifacts = artifacts;
									// artRef artifacts have baseUrl
		for (var a=0; a < this.artifacts.length; a++) {
			this.artifacts[a].setAttribute('baseUrl',artUrl);
		}
	}	

	
	/*=============================================
	* doArtifact()
	* ============================================*/

	function doArtifact(artifact, previousLevel){
		  
											// make artifact container

		var artDiv=document.createElement("div");
		
											// select and append icon
											
		var type = artifact.getAttribute("type");
		if (type=="folder") { var iconImgSrc="folder-icon.png";}
		if (type=="api") { var iconImgSrc="api.png";}
		if (type=="database") { var iconImgSrc="database.png";}
		if (type=="graph") { var iconImgSrc="graph.png";}
		if (type=="html") { var iconImgSrc="html-icon.png";}
		if (type=="script") { var iconImgSrc="script_icon.gif";}
		if (type=="webservice") { var iconImgSrc="network-transmit-receive.png";}
		if (type=="java") { var iconImgSrc="java-icon.png";}
		if (type=="spring") { var iconImgSrc="spring.png";}
		if (type=="xml") { var iconImgSrc="xml-icon.png";}
		var iconImg = document.createElement("img");
		iconImg.setAttribute("src",iconImgSrc);
		iconImg.setAttribute("title",type);
		iconImg.setAttribute("height","24");
		iconImg.setAttribute("width","24");
		artDiv.appendChild(iconImg);
											// append artifact id
											
		var artBaseUrl=artifact.getAttribute('baseUrl');
		if (artBaseUrl){
			for (var a=0; a < _artRefs.length; a++) {
				if (artBaseUrl == _artRefs[a].url)
					var artRefIndex = a;
			}
		}
		var artSpan = document.createElement("span");
		var artId = artifact.getAttribute("id");
		var artAlt = artifact.getAttribute("alt");
		if (artAlt) {
			artSpan.appendChild(document.createTextNode(artAlt));
		} else {
			artSpan.appendChild(document.createTextNode(artId));
		}
		
		var spanId=artId+lineNumber;
		artSpan.setAttribute("id", spanId);
		lineNumber++;
		artSpan.setAttribute("name", artId);
		if (artBaseUrl)
			artSpan.setAttribute("onclick", "showNotes('" + artId + "','" + artBaseUrl + "','" + spanId + "')" );
		else artSpan.setAttribute("onclick", "showNotes('"+ artId + "', '', '" + spanId + "','" + artAlt + "')" );
		artDiv.appendChild(artSpan);
											// indent
											
		artDiv.setAttribute("class","artDiv");
		var thisLevel=previousLevel + 2;
		artDiv.style.left=thisLevel+"em";	
											// display
											
		document.getElementById("treeDiv").appendChild(artDiv);
		
											// artifact's children
											
		for (var c=0; c < artifact.childNodes.length; c++) {
			switch (artifact.childNodes.item(c).nodeName) {
			
											// sub?
				case "sub":
					doArtifact(
						getArtifactById(
							artBaseUrl?_artRefs[artRefIndex].artifacts:_artifacts,
							artifact.childNodes.item(c).getAttribute("artifactID")
						)
					,thisLevel);
				break;
												// subRef?
				case "subRef":
					doArtifact(
						getArtifactByURI(
							artifact.childNodes.item(c).getAttribute("artifactURI")
						)
					,thisLevel);
				break;				
												// drilldown?
				case "drilldown":
												// drilldown link
									
					var ddAnchor = document.createElement("a");
					var ddURI = artifact.childNodes.item(c).getAttribute("docURI");
					ddAnchor.setAttribute("href",ddURI);
					
											// drilldown image
											
					var ddImg = document.createElement("img");
					var ddImgSrc="go-down.png";
					ddImg.setAttribute("src",ddImgSrc);
					ddImg.setAttribute("title","drilldown");
					ddImg.setAttribute("height","24");
					ddImg.setAttribute("width","24");
					ddImg.style.borderStyle="none";
					
											// display drilldown
											
					ddAnchor.appendChild(ddImg);
					artDiv.appendChild(ddAnchor);

				break;			
			}
		} 
	}
	
	/*=============================================
	* getTop()
	* 		Gets a parm "top" from the URL query string
	* ============================================*/
	
	function getTop() {
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for (var i=0;i<vars.length;i++) {
			var pair = vars[i].split("=");
			if (pair[0] == "top") {
				return pair[1];
			}
		}
		//alert(variable + " not found in the query string");
		return "index.codenotes.xml"
	}
	
	/*=============================================
	* go()
	* ============================================*/
	function go(){
										// display title

		var t = cnDoc.documentElement.getAttribute("title");
		t = t ? t : "Untitled";
		var hdg=document.createTextNode(t);
		document.getElementById("title").appendChild(hdg);
		
										// related
		var _related = cnDoc.documentElement.getElementsByTagName("related");
		if (_related.length > 0) {
										// jump image
									
			var refImg = document.createElement("img");
			var refImgSrc="go-up.png";
			refImg.setAttribute("src",refImgSrc);
			refImg.setAttribute("height","24");
			refImg.setAttribute("width","24");
			refImg.setAttribute("title","jump to...");
			refImg.style.borderStyle="none";
			var refAnchor = document.createElement("a");
			var refURI = "javascript:toggleVisibility('related-popup')";
			refAnchor.setAttribute("href",refURI);
			refAnchor.appendChild(refImg);
			titleDiv.appendChild(refAnchor);
				
										// pop up div (on top of Img)
			
			var relDiv = document.getElementById("reldiv");
			relDiv.setAttribute("class","popup");
			relDiv.setAttribute("id","related-popup");
			var popPos = findPos(refImg);
			relDiv.style.left=popPos[0];
			relDiv.style.top=popPos[1];
			relDiv.style.display="none";
			
										// links	
																			
			for (var r=0; r < _related.length; r++) {
				var refAnchor = document.createElement("a");
				var refURI = _related[r].getAttribute("docURI");
				refAnchor.setAttribute("href","codenotes.html?top="+refURI);
				var tokens=refURI.split(new RegExp("[?/=]"));						
				tokens=(tokens instanceof Array)?tokens[tokens.length -1]:tokens;
				tokens=tokens.split(".");
				refAnchor.innerHTML=(tokens instanceof Array)?tokens[0]:tokens;
				refAnchor.style.display="block";
				relDiv.appendChild(refAnchor);
			}						
			titleDiv.appendChild(relDiv);								
		}	
										// start traversing artifacts
										
		var bsId = cnDoc.documentElement.getAttribute("bootstrap");
		doArtifact(getArtifactById(_artifacts, bsId),0);
		showNotes(bsId, "", bsId + "0");
	}
	/*=============================================
	* findPos()
	* ============================================*/
	function findPos(obj) {
		var curleft = curtop = 0;
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
		return [curleft,curtop];
	}
	/*=============================================
	* toggleVisibility()
	* ============================================*/
	function toggleVisibility(id) {
       var e = document.getElementById(id);
       if(e.style.display == 'block')
          e.style.display = 'none';
       else
          e.style.display = 'block';
    }	
	
	var curentLine;
	/*=============================================
	* showNotes()
	* ============================================*/
	function showNotes(artId, baseUrl, spanId, artAlt){

		if (curentLine){ 
			curentLine.style.backgroundColor="";
			curentLine.style.color="";
		}
		if (spanId){
			var artSpan=document.getElementById(spanId);
		} else {
			var artSpan=document.getElementsByName(artId)[0];
		}			
			curentLine=artSpan;
			artSpan.style.backgroundColor="DeepSkyBlue";
			artSpan.style.color="white";
		
		
		
		var notesDiv=document.getElementById("notesDiv");
		if (notesDiv.firstChild) {
			notesDiv.removeChild(notesDiv.firstChild);
			notesDiv.removeChild(notesDiv.firstChild);
		}
		if (baseUrl) var artifact = getArtifactByURI(baseUrl+'#'+artId);
		else var artifact = getArtifactById(_artifacts, artId);

												// IE doesn't have the NS  interface
		if (artifact.getElementsByTagNameNS){
			var notes = artifact.getElementsByTagNameNS("http://www.w3.org/1999/xhtml","div")[0];
		} else {
			var notes = getSingleElementByTagNameNS(artifact,"http://www.w3.org/1999/xhtml","div");
		}
		
		if (notes) {
			var notesHeading = document.createElement("h2");
			if (typeof artAlt  === 'string' && artAlt!='null') {
				notesHeading.appendChild(document.createTextNode(artAlt));
			} else {
				notesHeading.appendChild(document.createTextNode(artId));
			}		
			notesDiv.appendChild(notesHeading);
			if (isIE){
				notesDiv.appendChild(kloneNode(notes,true));
			} else {
				notesDiv.appendChild(notes.cloneNode(true));
			}
			
		}
	}
	
	/*=============================================
	* getSingleElementByTagNameNS()
	* IE doesn't support getElemenstByTagNameNS (sigh)
	* ============================================*/
	
	function getSingleElementByTagNameNS(node,ns,tag){
		for (var n=0; n < node.childNodes.length; n++) {
			if ((node.childNodes[n].namespaceURI==ns)&&(node.childNodes[n].baseName==tag)){
				return node.childNodes[n];
			}
		}
	}
	
	/*=============================================
	* kloneNode()
	*   desperate attempt to get around IE
	*   appendChild woes ... didn't quite work
	* ============================================*/
	
	function kloneNode(node, allChildren) {
		switch (node.nodeType) {
			case document.ELEMENT_NODE:
				var newNode = document.createElement(node.nodeName);
					
												// does the node have attributes?
												
				if (node.attributes && node.attributes.length > 0)
					for (var i = 0; i < node.attributes.length;i++)
						newNode.setAttribute(node.attributes[i].nodeName, 
							node.getAttribute(node.attributes[i].nodeName));
							
												// need to go after any children?
												
				if (allChildren && node.childNodes && node.childNodes.length > 0)
					for (var i = 0; i < node.childNodes.length; i++)
						newNode.appendChild(kloneNode(node.childNodes[i], allChildren));
				return newNode;
				break;
			case document.TEXT_NODE:
			case document.CDATA_SECTION_NODE:
			case document.COMMENT_NODE:
				return document.createTextNode(node.nodeValue);
				break;
		}
	}
