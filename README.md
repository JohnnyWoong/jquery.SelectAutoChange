china-city-select
=================

简单可用的中国省份、城市、县区三级联动选择组件

![china-city-select](http://ww2.sinaimg.cn/mw690/831e9385jw1e60hh9sc2zj207q05kjrh.jpg)

原作者及项目地址：[http://blog.hpyer.cn/codes/js-auto-change-city-list](http://blog.hpyer.cn/codes/js-auto-change-city-list)

##使用说明

```javascript
var options = {
    country: 'country', //省级select ID
	state: 'state',     //市级select ID
	city: 'city',       //县区级select ID
	current: '',        //初始化时3个select的默认值，使用region code及 | 区分，如「 01|02|33 」，具体请查阅 xml 数据文件
	language: 'zh_cn',  
	path_to_xml: '',    //xml文件所在的地址
	read_only: false  
}

LocalList.mf_init(options);
```

##修改说明

原作者的代码会生成新的 3 个 select，不支持直接给已有的 select 绑定事件，因此拿来做了小小的改动支持上述特性。


##二次修改说明

可以选择为二级联动或三级联动,可以选择是否隐藏没有多余数据的联动,修正部分脚本错误

SelectList.mf_init({
  country: 'selCountry',                                           //一级 select 的 ID
  state: 'selState',                                               //二级 select 的 ID
  city: 'selCity',                                                 //三级 select 的 ID (可选,如为两级联动,则不需要该属性)
  hideState: 'true',                                               //是否隐藏只有一个子分类的二级分类(可选,默认为隐藏)
  defaultValue: ['---请选择---', '---请选择---', '---请选择---'],        //每个select的第一个option的值(可选,如为二级联动,则可以只写两个)
  current: '31|01|07',                                             //初始化时3个select的默认值，使用region code及 | 区分，如 '31|01|07' ，具体请查阅相对应的 xml 数据文件
  language: 'zh_cn',                                               //语言版本
  path_to_xml: 'data/china/',                                      //xml文件所在的文件夹
  read_only: false  
});
=======
```javascript
LocalList.mf_init({
    country: 'selCountry',
    state: 'selState',
    city: 'selCity',
    hideState: 'true',
    defaultValue: '---请选择---',
    current: '31|01|07',
    language: 'zh_cn',
    path_to_xml: 'data/china/',
    read_only: false  
});
```
