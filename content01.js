/**
 * Created by hua on 2017/9/12.
 */

//联系人列表
var Contact;
//基础参数
var BaseRequest;
//最新的消息
var news;
//微信初始化
var wxInit;
//群联系
var webwxbatchgetcontact;

var url_wx="https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?"+"me=me";
var url_wx_img="https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsgimg?"+"me=me"+"&fun=async"+"&f=json";

var Msg = {
    Type: 1,
    Content: "0",
    FromUserName: "0",
    ToUserName: "0",
    LocalID: "0",
    ClientMsgId: "0"
};

var replyImgMediaId = '';
var replyImgUrl = '';
var replyMessageUrl = 'https://weixin.diyli.cn/wechat/chrome/message';


/**
 * 接收来自background的消息
 *
 */
chrome.extension.onRequest.addListener(function (request) {
    //监听最新的消息
    if (request.url.indexOf("cgi-bin/mmwebwx-bin/webwxsync") >= 0) {
        //处理部分地域请求冲突
        if(request.url.indexOf("wx.qq.com")>=0){
            url_wx="https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?"+"me=me";
        }

        if (!request.content) return;

        news = JSON.parse(request.content);

        if (news.AddMsgCount && news.AddMsgCount > 0 && wxInit != null && (news.AddMsgList[0].Content != '')) {
            $.ajax({
                async : false,
                url: request.url + "&me=me",//避开循环标志
                type: 'POST',
                contentType: 'application/json;charset=UTF-8',
                data: JSON.stringify(JSON.parse(request.params.postData.text)),
                dataType: "json",
                success: function (res) {
                    // 如果联系人有变化
                    console.log(res, 'res');
                    if(res.ModContactCount === 1) {
                        sayHelloToNewGuys(res);
                    } else {
                        var contentObj = res.AddMsgList[0];
                        var contentArr = contentObj.Content.split('<br/>');
                        var paramsObj = {
                            content: '',
                            FromUserName: contentObj.FromUserName,
                            ToUserName: contentObj.FromUserName,
                            isAt: contentObj.Content.indexOf('币8-瑶瑶') > -1 ? 1 : 0
                        };
                        if(contentArr.length === 1) {
                            paramsObj.content = contentArr[0].replace(/@币8-瑶瑶 /, '');
                            replyKeyWord(paramsObj);
                        } else if(contentArr.length === 2){
                            paramsObj.content = contentArr[1].replace(/@币8-瑶瑶 /, '');
                            replyKeyWord(paramsObj);
                        }
                    }
                },
                error: function(err) {
                    console.error(err, 'err111');
                }
            });
        }
    }

    //初始化监听
    if (request.url.indexOf("cgi-bin/mmwebwx-bin/webwxbatchgetcontact") >= 0) {
        if (!request.Contact || !request.BaseRequest || !request.wxInit || !request.webwxbatchgetcontact) return;


        wxInit_a(request);
        Contact_a(request);
        webwxbatchgetcontact_a(request);
        // getReplyImgMediaId();

        BaseRequest = JSON.parse(request.BaseRequest.postData.text)
    }
});

// 给新添加的好友自动回复消息
var replyTextWord1 = '1.【加号奖励】感谢你与币8建立沟通链接，送一份数据资料（下方图片），聊表心意。';
var replyTextWord2 = '2.【私聊/群聊查询】发送：BTC，ETH，EOS等数字货币代号查看实时行情。';
var replyTextWord3 = '3.【拉群奖励】拉本号进一个币圈群的小伙伴，我将拉你进入币8内部群，群里有已实战翻多倍的大牛和专门的数据团队为你提供专业数据分析服务。';
function sayHelloToNewGuys(res) {
    Msg.FromUserName = wxInit.User.UserName;
    res.ModContactList.forEach(function(item) {
        Msg.ToUserName = item.UserName;
        Msg.Content = replyTextWord1 + '\n\n' + replyTextWord2 + '\n\n' + replyTextWord3;
        if(item.UserName.substr(0,2) !== '@@') {
            webwxsendmsg(BaseRequest, Msg, function () {
                Msg.MediaId = replyImgMediaId;
                webwxsendmsgimg(BaseRequest, Msg);
            });
        }
    });
}

// 请求关键字结果
function replyKeyWord(paramsObj) {
    $.ajax({
        async : false,
        url: replyMessageUrl + '?content=' + paramsObj.content + '&nickName=' + paramsObj.FromUserName + '&at=' + paramsObj.isAt,
        type: 'GET',
        dataType: "json",
        success: function (result) {
            Msg.ToUserName = paramsObj.ToUserName;
            Msg.FromUserName = wxInit.User.UserName;
            if(result.code == 200){
                Msg.Content = result.data;
                webwxsendmsg(BaseRequest, Msg)
            }
        },
        error: function(err) {
            console.error('请求关键字结果出错:', err);
        }
    })
}

function getReplayWhereFrom(res) {
    // webwxbatchgetcontact
}

// 获取图片 MediaId
function getReplyImgMediaId() {
    replyImgMediaId = '@crypt_31460533_f2e0008236c2674321984ac70b4f544a6bb3d76e64837af676c0e470b1095395f18a1a7c509f3ae14e72a4cda2c247e811800d440ba3c4cb41e48632d5c77c6478e3cc4bca61ed275f437b94b36f2aeffada690ee456bb70b64b88e760698f84f3ea4fbfdcd21a3df7551854ca3b6bd74f467dd2344e53cc600d0a1f4c6c235554eba5ee455aaab100faf480cabe7d07dbe6d41490790a64de92931ecb88a73941c17f3bdc6cb59ddb18e6a8726773aa0fb525b46f9d0a24c938635cfe074636a4beea72f75c3b550de09f5ef3a1b80582e797b29df2be6dde24d02b9b6a0af3c120fd3831d2ea7cc42b3cbaec7e34fb4dcc462193a763578b8a4949927a421b849bfab9f9df80c598da2ba939d622d1ba0714a0c28ef81ec363dc5bc63a8e401b7bb6cad0e6b2e669dfb4b38ea247dc367441652b658f44a489805df732efba';
    return;
    $.ajax({
        async : false,
        url: replyImgUrl,
        type: 'GET',
        dataType: "json",
        success: function (data) {
            replyImgMediaId = data
        },
        error: function(err) {
            console.error('请求回复图片MediaId出错:', err);
        }
    })
}


/**
 *发送文字消息
 *格式如下
 {
     BaseRequest: { Uin: xxx, Sid: xxx, Skey: xxx, DeviceID: xxx },
     Msg: {
         Type: 1 文字消息,
         Content: 要发送的消息,
         FromUserName: 自己的ID,
         ToUserName: 好友的ID,
         LocalID: 与clientMsgId相同,
         ClientMsgId: 时间戳左移4位随后补上4位随机数
     }
 }
 */

var clientMsgId;
function webwxsendmsg(BaseRequest, Msg, cb) {

    clientMsgId = new Date().getTime()
        + (Math.random() + "").substring(2, 6);
    Msg.LocalID = clientMsgId;
    Msg.ClientMsgId = clientMsgId;
    Msg.Type = 1;
    Msg.MediaId = '';
    $.ajax({
        url: url_wx,
        type: 'POST',
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify({
            BaseRequest: BaseRequest.BaseRequest,
            Msg: Msg,
            Scene: 0
        }),
        dataType: "json",
        success: function (data) {
            if(cb) {
                cb();
            }
            console.log('发送成功 text');
        }
    })
}
function webwxsendmsgimg(BaseRequest, Msg, cb) {
    clientMsgId = new Date().getTime()
        + (Math.random() + "").substring(2, 6);
    Msg.LocalID = clientMsgId;
    Msg.ClientMsgId = clientMsgId;
    Msg.Type = 3;
    Msg.Content = '';
    $.ajax({
        url: url_wx_img,
        type: 'POST',
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify({
            BaseRequest: BaseRequest.BaseRequest,
            Msg: Msg,
            Scene: 0
        }),
        dataType: "json",
        success: function (data) {
            if(cb) {
                cb();
            }
            console.log('发送成功 img');
        }
    })
}

/**
 *初始化个个人
 * @param request
 */
function wxInit_a(request) {
    $.ajax({
        url: request.wxInit.url,
        type: 'POST',
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify(JSON.parse(request.wxInit.postData.text)),
        dataType: "json",
        success: function (data) {
            wxInit = data
        },
        timeout: 3000,
        complete: function (XMLHttpRequest, status) {
            if (status == 'timeout') wxInit_a(request);
        }
    })
}
/**
 *初始化联系人
 * @param request
 */
function Contact_a(request) {
    $.ajax({
        url: request.Contact.url,
        type: 'GET',
        contentType: 'application/json;charset=UTF-8',
        dataType: "json",
        success: function (data) {
            if (data.MemberCount == 0) Contact_a(request);
            Contact = data
        },
        timeout: 4000,
        complete: function (XMLHttpRequest, status) {
            if (status == 'timeout') Contact_a(request);
        }
    })
}
/**
 *初始化联系人群
 * @param request
 */
function webwxbatchgetcontact_a(request) {
    $.ajax({
        url: request.webwxbatchgetcontact.url + "&me=me",//避开循环标志
        type: 'POST',
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify(JSON.parse(request.webwxbatchgetcontact.postData.text)),
        dataType: "json",
        success: function (data) {
            if (data.Count == 0) webwxbatchgetcontact_a(request);
            webwxbatchgetcontact = data
            console.log(webwxbatchgetcontact, 'webwxbatchgetcontact');
        },
        timeout: 3000,
        complete: function (XMLHttpRequest, status) {
            if (status == 'timeout') webwxbatchgetcontact_a(request);
        }
    })
}


/**
 * 用来保持在线
 *
 */
// var click=0;
// function timedCount01() {
//     setTimeout("timedCount01()", 20000)
//     if (!wxInit || !BaseRequest)  return;
//     //模拟点击
//     if(click==0) {
//         click=1;
//         $('.web_wechat_tab_chat').click()
//     }else {
//         click=0;
//         $('.web_wechat_tab_friends').click()
//     }
//     console.log("保持在线")
//     Msg.Content = "保持在线:" + new Date();
//     Msg.ToUserName = "filehelper";
//     Msg.FromUserName = wxInit.User.UserName;
//     webwxsendmsg(BaseRequest, Msg)
// }
// timedCount01()