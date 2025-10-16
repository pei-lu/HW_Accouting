[Link to main website](https://pei-lu.github.io/HW_Accouting/)

# 使用说明
## ！警告 本工具完全ai生成 不代表本人真实代码水平（真实水平更差）！

## 数据同步
数据同步功能由 gist实现，需要每次手动输入gist id 做好备份。 不适合用于较大规模的商业数据同步， 更多只是用于漫展/兽展临时出摊使用

使用前需要  
1. 进入设置  
![设置](asset/image1.png)
2. 生成 gist token  
![设置](asset/image2.png)  
![设置](asset/image3.png)  
![设置](asset/image4.png)  
3. 记住这个token 并且！！！绝对不要分享出去！！！别人要用别人自己生成
并在网页工具里使用它

## 工具使用
1. 其他功能太简单我就不讲了，界面已经很清晰了 主要说一下同步方式  
2. ![设置](asset/img5.png)  
点击github sync之后 用上面的token去生成一个新的记录账单，会自动创建一个gist仓库，并生成一个gist id
本次贩售之中请使用同一个gistid，这样也可以多设备同步。新创建就upload 更新就update

## 贩售内容更换
1. fork 本repo  
2. 打开merchList.yaml 把自己要贩售的商品替换进去就可以了  
3. 在自己的github里面重新publish page或者用别的方法host 服务都可以。[教程详见此处](https://docs.github.com/en/pages/quickstart)
