// ==UserScript==
// @id             Github-display-package.json
// @name           Github: display package.json dependencies
// @version        1.0
// @namespace      http://efcl.info/
// @author         azu
// @description    
// @include        https://github.com/*/*
// @run-at         document-end
// ==/UserScript==

(function(){
    var repositoryURL = document.querySelector('meta[property="og:url"]').getAttribute("content");
    /* USER/repositoryNAME */
    var userRepoPath = repositoryURL.replace("https://github.com/", "");
    var owner = userRepoPath.split("/").shift();
    var repoName = userRepoPath.split("/").pop();
    var treeSHA = document.querySelector(".commit-meta .js-clippy").dataset.clipboardText
    if (!treeSHA && userRepoPath){
        return null;
    }

    var main = function(){
        getTree({
            "owner" : owner,
            "name" : repoName,
            "sha" : treeSHA
        }, function(err, result){
            if (err){
                console.log("not found tree", err);
                return;
            }
            var url = getPackageJSON(JSON.parse(result));
            if (!url){
                console.log("not found package.json");
                return;
            }
            getFileRawContent(url, function(err, content){
                if (err){
                    console.log("doesn't get content", err);
                    return;
                }
                var list = createDependenciesList(JSON.parse(content));

                insertDependencies(list);
            });
        });
    };
    var insertDependencies = function(list){
        // insert to element
        var insertEle = document.querySelector(".repo-desc-homepage");
        var table = document.createElement("table");
        table.setAttribute("style", "margin: 5px 0;");
        var tbody = document.createElement("tbody");
        var th = document.createElement("td");
        th.setAttribute("style", "font-size:15x;font-weight:bold; margin: 5px 0;");
        th.textContent = "Dependencies";
        var tr = document.createElement("tr");
        tr.setAttribute("style", "font-size:13px;margin:3px;word-break:break-all;word-wrap: break-word;");
        var td = document.createElement("td");
        for (var i = 0, len = list.length; i < len; i++){
            var obj = list[i];
            var a = document.createElement("a");
            a.title = obj["name"];
            a.href = obj["url"];
            a.textContent = obj["name"];
            td.appendChild(a);
            td.appendChild(document.createTextNode(", "));
        }
        tr.appendChild(td);
        tbody.appendChild(th);
        tbody.appendChild(tr);
        table.appendChild(tbody);
        insertEle.appendChild(table);
    }

    main();

    // http://developer.github.com/v3/git/trees/
    // GET /repos/:owner/:repo/git/trees/:sha
    function getTree(repo, callback){
        var owner = repo.owner,
                repoName = repo.name,
                sha = repo.sha;
        var treeAPI = "https://api.github.com/repos/" + owner + "/" + repoName + "/git/trees/" + sha;
        GM_xmlhttpRequest({
            method : "GET",
            url : treeAPI,
            onload : function(res){
                callback(null, res.responseText);
            },
            onerror : function(res){
                callback(res);

            }
        });
    }

    function getFileRawContent(url, callback){
        // http://swanson.github.com/blog/2011/07/09/digging-around-the-github-v3-api.html
        GM_xmlhttpRequest({
            method : "GET",
            url : url,
            headers : {"Accept" : "application/vnd.github-blob.raw"},
            onload : function(res){
                callback(null, res.responseText);
            },
            onerror : function(res){
                callback(res);
            }
        });
    }

    // create dependencies
    function createDependenciesList(packageJSON){
        if (!("dependencies" in packageJSON)){
            return null;
        }
        var list = [];
        var dependencies = packageJSON["dependencies"];
        var keys = Object.keys(dependencies);
        for (var i = 0, len = keys.length; i < len; i++){
            var packageName = keys[i];
            list.push({
                "name" : packageName,
                "url" : "https://npmjs.org/package/" + packageName
            });
        }
        return list;
    }

    // "package.json"があるならURLを返す
    function getPackageJSON(json){
        var tree = json["tree"];
        for (var i = 0, len = tree.length; i < len; i++){
            var obj = tree[i];
            if (obj["type"] = "blob" && obj["path"] == "package.json"){
                return obj["url"];
            }
        }
        return false;
    }

})();