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
}


/**
 * 接收来自background的消息
 *
 */
chrome.extension.onRequest.addListener(function (request) {

    //console.log(request);


    //监听最新的消息
    if (request.url.indexOf("cgi-bin/mmwebwx-bin/webwxsync") >= 0) {
        console.log('接受消息也会触发?');
        //处理部分地域请求冲突
        if(request.url.indexOf("wx.qq.com")>=0){
            url_wx="https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?"+"me=me";
        }

        if (!request.content) return;
        news = JSON.parse(request.content);
        if (news.AddMsgCount && news.AddMsgCount > 0 && wxInit != null && (news.AddMsgList[0].Content != '')) {
            console.log('这个什么时候触发?????');

            $.ajax({
                async : false,
                url: request.url + "&me=me",//避开循环标志
                type: 'POST',
                contentType: 'application/json;charset=UTF-8',
                data: JSON.stringify(JSON.parse(request.params.postData.text)),
                dataType: "json",
                success: function (res) {
                    console.log(res, 'res111');
                    if(res.ModContactCount !== 0) {
                        Msg.FromUserName = wxInit.User.UserName;
                        Msg.Content = 'hello, 扫码入群';
                        res.ModContactList.forEach(function(item) {
                            console.log(item, 'item');
                            Msg.ToUserName = item.UserName;
                            if(item.UserName.substr(0,2) !== '@@') {
                                webwxsendmsg(BaseRequest, Msg, function () {
                                    Msg.MediaId = "@crypt_31460533_f2e0008236c2674321984ac70b4f544a6bb3d76e64837af676c0e470b1095395f18a1a7c509f3ae14e72a4cda2c247e811800d440ba3c4cb41e48632d5c77c6478e3cc4bca61ed275f437b94b36f2aeffada690ee456bb70b64b88e760698f84f3ea4fbfdcd21a3df7551854ca3b6bd74f467dd2344e53cc600d0a1f4c6c235554eba5ee455aaab100faf480cabe7d07dbe6d41490790a64de92931ecb88a73941c17f3bdc6cb59ddb18e6a8726773aa0fb525b46f9d0a24c938635cfe074636a4beea72f75c3b550de09f5ef3a1b80582e797b29df2be6dde24d02b9b6a0af3c120fd3831d2ea7cc42b3cbaec7e34fb4dcc462193a763578b8a4949927a421b849bfab9f9df80c598da2ba939d622d1ba0714a0c28ef81ec363dc5bc63a8e401b7bb6cad0e6b2e669dfb4b38ea247dc367441652b658f44a489805df732efba";
                                    webwxsendmsgimg(BaseRequest, Msg);
                                });
                            }
                        });
                    } else {
                        $.ajax({
                            async : false,
                            url: 'https://bird.ioliu.cn/mobile?shouji=' + res.AddMsgList[0].Content,//避开循环标志
                            type: 'GET',
                            dataType: "json",
                            success: function (data) {
                                console.log(data.msg, 'data2222');
                                Msg.ToUserName = "filehelper";
                                Msg.FromUserName = wxInit.User.UserName;
                                if(data.status == '0'){
                                    Msg.Content = '币8er:' + data.result.province + data.result.city + data.result.company;
                                } else {
                                    Msg.Content = "币8er：" + data.msg;
                                }
                                webwxsendmsg(BaseRequest, Msg)
                            },
                            error: function(err) {
                                console.error(err, 'err222');
                                Msg.Content = "币8er: 发送错误" ;
                                Msg.ToUserName = "filehelper";
                                Msg.FromUserName = wxInit.User.UserName;
                                webwxsendmsg(BaseRequest, Msg)
                            }
                        })
                    }
                },
                error: function(err) {
                    console.error(err, 'err111');
                    Msg.Content = "币8er: 发送错误" ;
                    Msg.ToUserName = "filehelper";
                    Msg.FromUserName = wxInit.User.UserName;
                    webwxsendmsg(BaseRequest, Msg)
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

        BaseRequest = JSON.parse(request.BaseRequest.postData.text)
    }


});


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
            console.log('发送成功 test');
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