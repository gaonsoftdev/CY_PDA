var html5QrCode = null;
var app = new Vue({
	el: '#app',
	data:{
		params: GX.getParameters(),
		lang: GX.LANGS[GX.Cookie.get('lang')][location.pathname.substring(1).split('.')[0]],
		langSel: GX.LANGS[GX.Cookie.get('lang')],
		convertKeys:{
			ReqQty:'quantity2'
		},
		firstData:{
			SerialNo:'0',
			BottleName:'',
			BottleNo:'',
			BottleSpec:'',
			BottleSeq:'0'
		},
		rows:{
			BottleMoveList:[],
			OutWHList:[],
			InWHList:[],
			BottleList:[]
		},
		BottleNo:'',
		queryForm:{
			Date: GX.formatDate(new Date(), 'Y-M-D'), //GX.formatDate(GX.nowDate().full, 'Y-M-D'),
			DVReqNo: '',
			OutWHSeq: '',
			IsBarCodeChange: true,
		},


		codeHelp:{
			ItemNo:''
		},
		codeHelpRequest:{
			ItemNo:['ItemNo'],
		},
		codeHelpResponse:{
			ItemNo:['ItemName','ItemNo','ItemSeq','Spec','UnitSeq'],
		},
		codeHelpDependencyKey:{},
		codeHelpGroupKey:{},
		codeHelpQryTypeMapKey:{},
		isReCalls:[],
		isCheckList:[],
		isAllowedCamera: (typeof navigator.getUserMedia == 'function'), // scanner 관련
		isScanning: false, // scanner 관련
		isReadyCamera: false, // scanner 관련
		pdaPort: GX.Cookie.get('pdaPort')
	},
	methods:{

		selectBottleMoveList: function(){
			var vThis = this;
			
			GX._METHODS_
			.setMethodId('Genuine.enModuleName.BisBottleMovePDA_en/MoveBottleMove')
			.ajax([{}], [function(data){
				console.log(data);
				if(data[0] != null){
					vThis.rows.BottleMoveList = data;
				}
			}], true);


		},
		selectOutWHNameist: function(){
			var vThis = this;
			
			GX._METHODS_
			.setMethodId('Genuine.enModuleName.BisBottleMovePDA_en/MoveOutWHName')
			.ajax([{}], [function(data){
				console.log(data);
				if(data[0] != null){
					vThis.rows.OutWHList = data;
				}
			}], true);


		},
		selectInWHNameList: function(){
			var vThis = this;
			
			GX._METHODS_
			.setMethodId('Genuine.enModuleName.BisBottleMovePDA_en/MoveInWHName')
			.ajax([{}], [function(data){
				console.log(data);
				if(data[0] != null){
					vThis.rows.InWHList = data;
				}
			}], true);


		},
		add: function(){
			console.log('add', event.code, event.keyCode);

			if(event.keyCode == 13){

				var vThis = this;
				let params = {
					"BottleNo": this.BottleNo,
					"IsBarCodeChange": this.queryForm.IsBarCodeChange?'1':'0',
				};
			
				GX._METHODS_
				.setMethodId('Genuine.enModuleName.BisPDInvoiceAPI_en/BottleBarCode')
				.ajax([params], [function(data){
					console.log(data);
					if(data[0] != null && data.length == 1){
						
						let BottleSeq = data[0].BottleSeq;
						let isDuplicated = false;
						let BottleList = GX.deepCopy(vThis.rows.BottleList);
						let temp = data[0];
						temp.SerialNo = BottleList.length;
						for(let i in BottleList){
							if(BottleList.hasOwnProperty(i) && BottleList[i].BottleSeq == BottleSeq){
								isDuplicated = true;
								break;
							}
						}

						vThis.BottleNo = '';

						if(isDuplicated) alert(vThis.langSel.msg.duplicate);
						else {
							params = {
								'BottleSeq': BottleSeq,
								'Param1': 4,
								'Seq': 0,
								'Serl': vThis.queryForm.OutWHSeq,
								'Date': vThis.queryForm.DVReqNo,
							};
							GX._METHODS_
							.setMethodId('Genuine.enModuleName.BisWPDBottleProcAPI_en/CheckDouble')
							.ajax([params], [function(data){
								console.log(data);

								if(data[0] != null){
									if(data[0].Status == 0) {
										BottleList.splice(1 , 0 ,temp);
										//BottleList.push(temp);
										vThis.rows.BottleList = BottleList;
										//vThis.BottleNo = '';
									}
									else if (data[0].Result != null) {
										// alert(data[0].Result);
									} 
								}
								else alert(vThis.langSel.msg.err);

							}], true);
						}
					}
				}], true);

			}
		},
		remove: function(idx){
			// if (confirm(this.rows.BottleList[idx].SerialNo + '번 항목을 삭제하시겠습니까?')) this.rows.BottleList.splice(idx, 1);
			if(confirm(this.langSel.msg.del)) this.rows.BottleList.splice(idx, 1);
		},
		save: function(){
			var vThis = this;
			let BottleList = GX.deepCopy(this.rows.BottleList);
			let first = BottleList.shift();

			if(BottleList.length > 0){
				if(GX.Validation.run('', 'validate')){

					const Date = GX.formatDate(this.queryForm.Date, 'YMD');
					const UserSeq = GX.Cookie.get('UserSeq');
					const EmpSeq = GX.Cookie.get('EmpSeq');
					const BizUnit = GX.Cookie.get('BizUnit');
					const DeptSeq = GX.Cookie.get('DeptSeq');
					const ReqBizUnit = GX.Cookie.get('ReqBizUnit');
					let params = [];
					let param = {};
					for(let i in BottleList){
						if(BottleList.hasOwnProperty(i)){
							param = {};
							param.DVReqNo = vThis.queryForm.DVReqNo;
							param.InvoiceDate = Date;
							param.BottleSeq = BottleList[i].BottleSeq;
							param.ItemSeq = BottleList[i].ItemSeq;
							param.LotNo = BottleList[i].LotNo;
							param.InvoiceSeq = 0;
							param.InvoiceSerl = 0;
							param.PacDetailsSerl = 0;
							param.UserSeq = UserSeq;
							param.EmpSeq = EmpSeq;
							param.DeptSeq = DeptSeq;
							param.BizUnit = BizUnit;
							params.push(param);
						}
					}
		
					GX._METHODS_
					.setMethodId('Genuine.enModuleName.BisPDInvoiceAPI_en/InvoiceSave')
					.ajax(params, [function(data){
						console.log(data);
	
						if(data[0] != null){
							if(data[0].Status == 0){
								// alert('정상적으로 처리되었습니다.');
								vThis.init();
							}
							else if(data[0].Result != null) alert(data[0].Result);
						}
						else alert(vThis.langSel.msg.err);
	
					}], true);
	
					
				}
			}
			else alert(vThis.langSel.msg.bottleNoChk);

		},
		init: function(){
			console.log('init.....');
			this.rows.BottleList = [this.firstData];
			this.BottleNo = '';
			this.queryForm.WHSeq = '';
		},
		scanBarCode: function(){
			var vThis = this;
			// let clipboardData = event.clipboardData || window.clipboardData;
			let objAll = document.querySelectorAll('[gx-scanner="Y"]');
			let obj;
			if (objAll[0] == document.activeElement) {
				obj = objAll[0];
				obj.focus();
			} else {
				obj = objAll[1];
				obj.focus();
				if(obj.value != null && obj.value.length > 0 && event.keyCode == '13'){
					let QRCodeData = obj.value;
					obj.value = '';
					let activeObjName = '';
					let activeTabIdx = '';
					let isFocused = (document.querySelector('input:focus') != null);
					let isChange = '';
					
					let scannerObj = document.querySelectorAll('[gx-scanner="Y"]');
						
					//vThis.queryForm.BottleNo = QRCodeData.replaceAll(' ', '');

					vThis.BottleNo = QRCodeData;
					vThis.add();
					
					event.preventDefault();
				}
			}
			
		},
		setProduction: function(){
			console.log('setProduction');
			console.log(event.target.value + ' != ' + this.itemData.ItemNo);
			if(event.target.value != this.itemData.ItemNo) {console.log('setProduction1', event.target.value+' != '+this.itemData.ItemNo);
				////////////////////////////////////////////////////////////////////
				var vThis = this;
				let itemNo = (this.itemData.ItemNo != null) ? this.itemData.ItemNo : '';
				
				if(itemNo.length > 0){
					GX._METHODS_
					.setMethodId('Main')
					.ajax([{QryType:'ItemNo', ItemNo:itemNo}], [function(data){
						console.log('ItemNo',data);
						if(data[0].ItemNo != null){
							let itemData = GX.deepCopy(vThis.itemData); //참조없는 복사
							Object.assign(itemData, data[0]);
							vThis.itemData = itemData;
							vThis.itemData.ItemNo = itemNo;
						}
						else {
							vThis.init();// itemData 초기화
						}
	
						/////////////////////////////////// 후처리 시작
						vThis.postProcessingCodeHelp();
						/////////////////////////////////// 후처리 끝
	
					}], true);
					// .ajax([{QryType:'UnitName', ItemNo:itemNo}], [function(data){
					// 	//console.log('UnitName',data);
					// 	if(data[0].UnitSeq != null){
					// 		//console.log(Object.keys(data[0]));
					// 		vThis.rows['UnitName'] = data;
					// 	}
					// 	else {
					// 		vThis.rows['UnitName'] = [];
					// 	}
					// }], false);
				}
				else{
					this.itemData = GX.getInitVueModelByFormDefault(this.itemData);
					this.rows.UnitName = [];
				}
				////////////////////////////////////////////////////////////////////
			}
			else {
				console.log(event.target.value + ' @!= ' + this.itemData.ItemNo);
				this.inputSearchCodeHelp();
			}

		},
		runScanner: function(inputName){ // scanner 관련

			//let e = new Event('paste', true);
			//document.body.dispatchEvent(e);

			let appInfo = GAON.AppBridge.getAppInfo();
			if(appInfo.GaonIsApp != ''){
				const appendName = (inputName != null) ? inputName.match(/([^\.]*)$/i)[1].capitalizeFirstLetter() : '';
					
				//MobileERPSetting://~,knicdev_oper~,KNIC DEV~,http://121.146.68.20:8081/mobileappSvc/~,
				// once, infinity
				GAON.AppBridge.requestApp('QRCodeScanner', 'once', 'responseApp'+appendName);
			}
			else {
				if(this.isAllowedCamera){
					if(this.isReadyCamera && !this.isScanning && !html5QrCode.isScanning){
						this.isScanning = true;
						//this.isScanBox = true;

						document.getElementById('scanner-container').style.display = 'block';
						document.getElementById('scanner-container').style.visibility = 'hidden';
						document.body.style.overflow = 'hidden';

						var vThis = this;
						GX.SpinnerBootstrap.show();

						html5QrCode.start({facingMode: "environment"}, {fps: 10, qrbox: 250},
							QRCodeData => {
								GX.beepSound();
								/* handle success */
								if(QRCodeData != null && QRCodeData.length > 0) {
									
									if(inputName == null) vThis.setItems(QRCodeData);
									else{
										const namePart = inputName.split('.');

										if(namePart.length == 1) vThis[namePart[0]] = QRCodeData;
										else if(namePart.length == 2) vThis[namePart[0]][namePart[1]] = QRCodeData;
										else if(namePart.length == 3) vThis[namePart[0]][namePart[1]][namePart[2]] = QRCodeData;
										
										//GX.TabIndex.next(namePart[namePart.length - 1]);
										const name = namePart[namePart.length - 1];
										document.querySelector('[name="'+name+'"]').value = QRCodeData;
										GX.TabIndex.next(name);
									}
								}
								//vThis.isScanBox = false;
								document.getElementById('scanner-container').style.display = 'none';
								document.getElementById('scanner-container').style.visibility = 'hidden';
								document.body.style.overflow = 'unset';

				                //console.log(html5QrCode.isScanning, html5QrCode.getState());
				                html5QrCode.stop();
				                html5QrCode.clear();
								vThis.isScanning = false;
				            },
							message => {
								/* handle error */
		            		}
						).then(() => {
							document.getElementById('scanner-container').style.display = 'block';
							document.getElementById('scanner-container').style.visibility = 'visible';

							console.log('닫기 버튼 로딩');
							GX.SpinnerBootstrap.hide();
		                });
					}

				}
				else document.getElementById('info-container').style.display = 'block';//this.isInfoBox = true;
			}

			event.target.blur();
		},
		stopScanner: function(){ // scanner 관련
			if(this.isAllowedCamera){
				if(this.isScanning && html5QrCode.isScanning){
					document.body.style.overflow = 'unset';
					//this.isScanBox = false;
					document.getElementById('scanner-container').style.display = 'none';
					document.getElementById('scanner-container').style.visibility = 'hidden';
					//console.log(html5QrCode.isScanning, html5QrCode.getState());
					html5QrCode.stop();
					html5QrCode.clear();

					this.isScanning = false;
					event.target.blur();
				}
			}
		},
		closeInfo: function(){ // scanner 관련
			//this.isInfoBox = false;
			document.getElementById('info-container').style.display = 'none';
			event.target.blur();
		},
		copyUnsafelyUrl: function(){ // scanner 관련
			GX.SNS.copyUrlToClipboard('chrome://flags/#unsafely-treat-insecure-origin-as-secure', '카메라 접근 예외 설정 주소 복사');
			event.target.blur();
		},
		copyLocationOrigin: function(){ // scanner 관련
			GX.SNS.copyUrlToClipboard(location.origin, '카메라 허용 URL 주소 복사');
			event.target.blur();
		},


		showCodeHelp: function(targetName){
			let obj = document.querySelector('[code-help="'+targetName+'"]');
			if(obj != null) {
				if(!GX.isShowElement(obj)){
					document.body.style.overflow = 'hidden';
					obj.style.display = 'block';
				}
			}
		},
		anotherDisplayCodeHelp: function(targetName, display){
			let obj = document.querySelector('[code-help="'+targetName+'"]');
			if(obj != null) {
				let objs = obj.parentElement.children;
				for(let i in objs){
					if(objs.hasOwnProperty(i) && !objs[i].hasAttribute('code-help') && !objs[i].hasAttribute('gx-layer')) objs[i].style.display = display;
				}
			}
		},
		openCodeHelp: function(){
			let targetName = event.target.name;
			let targetValue = event.target.value;
			let vThis = this;
			GX.doubleClickRun(event.target, function(){
				vThis.focusCodeHelp(targetName);
				vThis.setSearchCodeHelp(targetName, targetValue); //vThis.codeHelp[targetName] = targetValue;
				vThis.searchCodeHelp(event.target.name, false);

				if(vThis.codeHelpDependencyKey[targetName] != null) targetName = vThis.codeHelpDependencyKey[targetName];

				vThis.showCodeHelp(targetName);
				vThis.anotherDisplayCodeHelp(targetName, 'none');

			});
		},
		closeCodeHelp: function(targetName){
			let obj = document.querySelector('[code-help="'+targetName+'"]');
			if(obj != null) {
				if(GX.isShowElement(obj)){	
					obj.style.display = 'none';
					document.body.style.overflow = 'unset';

					this.anotherDisplayCodeHelp(targetName, 'block');

					let keys = null;
					let responseKeys = this.codeHelpResponse[targetName];
					if(responseKeys != null) keys = GX.deepCopy(responseKeys); 
					else if(this.codeHelpGroupKey[targetName] != null) keys = [this.codeHelpGroupKey[targetName]];
					if(keys != null){
						console.log('ss-targetName', keys, targetName)
						for(let i in keys) {
							if(keys.hasOwnProperty(i)){
								if(this.codeHelp[keys[i]] != null) this.codeHelp[keys[i]] = '';
								let comebackObj = document.querySelector('[check-double-click][name="' + keys[i] + '"]');
								console.log(i, keys[i], comebackObj)
								if(comebackObj != null) comebackObj.focus();
							}
						}	
					}	
				}
			}
		},
		setSearchCodeHelp: function(key, value){
			const idx = (this.codeHelp[key] == null && this.codeHelpDependencyKey[key] != null) ? this.codeHelpDependencyKey[key] : key;
			if(this.codeHelp[idx] != null){
				this.codeHelp[idx] = value;
			}
			this.initPagingCodeHelp(key);
		},
		focusCodeHelp: function(targetName){
			let tempTargetName = (this.codeHelpDependencyKey[targetName] != null) ? this.codeHelpDependencyKey[targetName] : targetName;
			if(this.itemData[targetName] != null && this.codeHelpGroupKey[tempTargetName] != null) this.codeHelpGroupKey[tempTargetName] = targetName;

			if(event.type == 'click'){
				if(tempTargetName != targetName && this.codeHelp[tempTargetName] != null) {
					if(this.codeHelp[tempTargetName] != null) this.setSearchCodeHelp(tempTargetName, ''); //this.codeHelp[tempTargetName] = '';
				}

				for(let i in this.codeHelpDependencyKey) {
					if(this.codeHelpDependencyKey.hasOwnProperty(i) && this.codeHelpDependencyKey[i] == tempTargetName){
						this.setSearchCodeHelp(i, ''); //this.codeHelp[i] =  '';
					} 
				}
			}
		},
		inputSearchCodeHelp: function(){
			this.focusCodeHelp(event.target.name);
			this.setSearchCodeHelp(event.target.name, event.target.value); //this.codeHelp[event.target.name] = event.target.value;
			this.searchCodeHelp(event.target.name, true);
		},
		searchCodeHelp: function(targetName, isOnePick){
			let keys = this.codeHelpResponse[targetName];
			let tempTargetName = (this.codeHelpDependencyKey[targetName] != null) ? this.codeHelpDependencyKey[targetName] : targetName;

			//let targetName = (this.codeHelpDependencyKey[temptargetName] != null) ? this.codeHelpDependencyKey[event.target.name] : event.target.name;
			if(this.codeHelpGroupKey[tempTargetName] != null) targetName = this.codeHelpGroupKey[tempTargetName];

			let obj = document.querySelector('#grid-'+(tempTargetName.toLowerCase())+' tbody tr.check');
			if(obj != null) obj.className = '';

			let params = {};
			//if(this.codeHelp[targetName] != null) params[targetName] = this.codeHelp[targetName];		
			if(this.codeHelpRequest[targetName] == null) this.codeHelpRequest[targetName] = [targetName];

			let paramKeyParse = [];
			let dataKey = '';
			for(let i in this.codeHelpRequest[targetName]){
				if(this.codeHelpRequest[targetName].hasOwnProperty(i)){
					paramKeyParse = this.codeHelpRequest[targetName][i].split('=');
					dataKey = (paramKeyParse.length == 2) ? paramKeyParse[1] : paramKeyParse[0];

					params[paramKeyParse[0]] = (this.codeHelp[dataKey] != null) ? this.codeHelp[dataKey] : this.itemData[dataKey];
				}
			}

			params.QryType = (this.codeHelpQryTypeMapKey[targetName] != null) ? this.codeHelpQryTypeMapKey[targetName] : targetName;//'EmpName';

			let pageCountObj = document.querySelector('[code-help="'+tempTargetName+'"] [name="PageCount"]');
			let pageSizeObj = document.querySelector('[code-help="'+tempTargetName+'"] [name="PageSize"]');
			if(pageCountObj != null && pageCountObj.value.match(/^[^0]\d*$/) == null) pageCountObj.value = 1;
			params.PageCount = (pageCountObj != null) ? pageCountObj.value : 1;
			params.PageSize = (pageSizeObj != null) ? pageSizeObj.value : 50;

			var vThis = this;
			GX._METHODS_
			.setMethodId('Main')
			.ajax([params], [function(data){
				for(var di in data){
					if(data.hasOwnProperty(di)){
						data[di].SerialNo = Number(di)+1 + (params.PageSize * (params.PageCount - 1));
					}
				}

				if(isOnePick){
					if(data.length == 1){
						for(let i in keys) {
							if(keys.hasOwnProperty(i)) vThis.itemData[keys[i]] = data[0][keys[i]];
						}

						/////////////////////////////////// 후처리 시작
						vThis.postProcessingCodeHelp();
						/////////////////////////////////// 후처리 끝
					}
					else if(data.length > 1) vThis.showCodeHelp(tempTargetName);
				}

				vThis.rows[tempTargetName.capitalizeFirstLetter('L') + 'ListQuery'] = (data.length == 0 || (data[0].Status != null && String(data[0].Status).length > 0)) ? [] : data; //empNameListQuery
			}]);

			if(event.type == 'click') event.target.blur();
		},
		selectCodeHelp: function(index){
			if(event.target.closest('tr') != null) {
				event.target.selectedIndex = index;
				let obj = event.target.closest('tbody').children;
				for(let i in obj){
					if(obj.hasOwnProperty(i)) {
						obj[i].selectedIndex = i;
						obj[i].className = (i == String(index)) ? 'check' : '';
					}
				}				
			}
			else {
				event.target.selectedIndex = index;
				event.target.className = 'check';
			}
		},
		selectedApplyCodeHelp: function(targetName){

			let obj = document.querySelector('#grid-'+(targetName.toLowerCase())+' tbody tr.check');

			let tempTargetName = (this.codeHelpGroupKey[targetName] != null) ? this.codeHelpGroupKey[targetName] : targetName;

			let keys = this.codeHelpResponse[tempTargetName];

			if(obj != null) {
				
				let keyParse = [];
				let dataKey = '';
				
				for(let i in keys) {
					if(keys.hasOwnProperty(i)) {

						keyParse = keys[i].split('=');
						dataKey = (keyParse.length == 2) ? keyParse[1] : keyParse[0];

						this.itemData[keyParse[0]] = this.rows[targetName.capitalizeFirstLetter('L') + 'ListQuery'][obj.selectedIndex][dataKey];
					}
				}


				/////////////////////////////////// 후처리 시작
				this.postProcessingCodeHelp();
				/////////////////////////////////// 후처리 끝

				this.closeCodeHelp(targetName);
			}
			else alert('시트에서 사용할 코드를 선택후 선택하기 버튼을 눌러주세요.');
		},
		initPagingCodeHelp: function(targetName){
			let pageCountObj = document.querySelector('[code-help="'+targetName+'"] [name="PageCount"]');
			let pageSizeObj = document.querySelector('[code-help="'+targetName+'"] [name="PageSize"]');
			if(pageCountObj != null) pageCountObj.value = 1;
			if(pageSizeObj != null) pageSizeObj.value = 50;
		},
		pagingCodeHelp: function(targetName, action){
			let pageCountObj = document.querySelector('[code-help="'+targetName+'"] [name="PageCount"]');
			if(pageCountObj != null){
				let count = pageCountObj.value;
				if(action == 'prev' && pageCountObj.value > 1) pageCountObj.value--;
				else if(action == 'next') pageCountObj.value++;

				if(count != pageCountObj.value) this.searchCodeHelp(targetName);
			}
		},
		postProcessingCodeHelp: function(){
			let vThis = this;
			let itemNo = (this.itemData.ItemNo != null) ? this.itemData.ItemNo : '';
			console.log('sssssssss['+itemNo+']'+this.itemData.UnitSeq);
			if(itemNo.length > 0){
				GX._METHODS_
				.setMethodId('Main')
				.ajax([{QryType:'UnitName', ItemNo:itemNo}], [function(data){
					//console.log('UnitName',data);
					if(data[0].UnitSeq != null){
						//console.log(Object.keys(data[0]));
						vThis.rows['UnitName'] = data;
						console.log(data);
						////////////////////////////////////////
						if(vThis.itemData.UnitSeq != null) {
							let obj = document.querySelector('[name="UnitSeq"]');
							if(obj != null) obj.value = vThis.itemData.UnitSeq;
						}
						////////////////////////////////////////
					}
					else {
						vThis.rows['UnitName'] = [];
					}
				}], false);
			}
			else{
				this.itemData = GX.getInitVueModelByFormDefault(this.itemData);
				this.rows.UnitName = [];
			}
		},
		toggle: function(){
			document.getElementsByClassName('toggle-switch')[0].classList.toggle('active');
		}
	},
	mounted(){
		const vThis = this;
		GX.Calendar.datePicker('gx-datepicker', {
			height:'400px',
			//format:'Y-M-D',
			monthSelectWidth:'25%',//25% or 100%
			callback: function(result, attribute){
				const openerObj = document.querySelector('[name="'+GX.Calendar.openerName+'"]');
				const info = GX.Calendar.dateFormatInfo(openerObj);
				let keys = attribute.split('.');
				if(keys.length == 1 && vThis[keys[0]] != null) vThis[keys[0]] = (result.length == 0) ? '' : GX.formatDate(result, info.format);
				else if(keys.length == 2 && vThis[keys[0]][keys[1]] != null) vThis[keys[0]][keys[1]] = (result.length == 0) ? '' : GX.formatDate(result, info.format);
				else if(keys.length == 3 && vThis[keys[0]][keys[1]][keys[2]] != null) vThis[keys[0]][keys[1]][keys[2]] = (result.length == 0) ? '' : GX.formatDate(result, info.format);
			}
		});//.set(2022, 1);

		GX.NumberType.init(GX._DATAS_.convertRules);

		// this.selectBottleMoveList();
		this.selectOutWHNameist();
		// this.selectInWHNameList();

	},
	created(){
		if(!GX._METHODS_.isLogin()) location.replace('login.html');
		else {
			const vThis = this;
			//GX.SpinnerBootstrap.init();
			GX.SpinnerBootstrap.init('loading', 'loading-wrap', '<div class="container"><img src="img/loading.gif" alt=""><span>처리중입니다...</span></div>');
			
			this.queryForm.Date = GX.formatDate(GX.nowDate().full, 'Y-M-D');

			// vThis.queryForm.BizUnit = GX.Cookie.get('BizUnit');
			// vThis.queryForm.BizUnitName = GX.Cookie.get('BizUnitName');
			// vThis.queryForm.EmpSeq = GX.Cookie.get('EmpSeq');

			this.rows.BottleList = [this.firstData];
				
			GX.VueGrid
			.init()
			// .bodyRow(':class="{\'check\':isChecked(index)}"')
			.item('ReqSerl',{rowspan:2}).head('{{lang.column[0]}}', '')
			.body('<button v-if="index > 0" class="del" @click="remove(index);"></button>', 'text-c')
			.item('SerialNo',{rowspan:2}).head('{{lang.column[1]}}', 'num')
			.body('<span v-if="index > 0">{{row.SerialNo}}</span>',)
			.item('BottleNo').head('{{lang.column[2]}}', '') //용기코드
			.body('<span>{{row.BottleNo}}</span><input type="text" v-if="index == 0" id="BottleNo" v-model="BottleNo" gx-scanner="Y"> ', 'code-help')
			.item('BottleName').head('{{lang.column[3]}}', '') //용기명
			// .body('<span>{{row.BottleNo}}</span><input type="text" v-if="index == 0" id="BottleNo" v-model="BottleNo" @keyup="add();" autofocus="autofocus" gx-scanner="Y"> ', 'code-help')
			.item('Qty',{rowspan:2}).head('{{lang.column[4]}}', '')
			.nl()
			.item('ItemName').head('{{lang.column[5]}}', '')
			.item('LotNo').head('{{lang.column[6]}}', 'border-r').body('{{row.LotNo}}', 'text-r border-r')
			.loadTemplate('#grid', 'rows.BottleList');




			// if(this.params.QryType != null && this.params.QryType == 'Query') this.search(this.params);

			// select box에 scannr enter evnet 막기 시작 /////////////
			GX.SelectBoxEnterPrevention.init();
			// select box에 scannr enter evnet 막기 끝 /////////////

			// 스캐너 입력이 하나인 경우 포커스 없이도 해당 스캔 입력박스에 스캔값 입력처리를 위한 이벤트
			document.body.addEventListener('keydown', this.scanBarCode, false);

			// 다음 입력창 이동을 위한 tab index 부여 시작 /////////////
			GX.TabIndex.indexing();
			// 다음 입력창 이동을 위한 tab index 부여 끝 /////////////

			// 스캐너 입력박스 - 기본 모바일 가상 키보드 막기 시작 /////////////
			GX.VirtualKeyboardPrevention.init('[gx-scanner="Y"]');
			// 스캐너 입력박스 - 기본 모바일 가상 키보드 막기 끝 /////////////




			let objs = document.querySelectorAll('input');
			
			for(let oi in objs){
				if(objs.hasOwnProperty(oi)) objs[oi].setAttribute('autocomplete', 'off');
			}
		}
	}

});

function responseAppReWorkPallet(action, result){
	if(action == 'QRCodeScanner'){ // scanner 관련
		if(typeof result == 'object' && result.param == 'once') {
			app.queryForm.ReWorkPallet = result.result;
			// GX.TabIndex.next('ItemNo');
		}
	}
}

function responseAppInputPallet(action, result){
	if(action == 'QRCodeScanner'){ // scanner 관련
		if(typeof result == 'object' && result.param == 'once') {
			app.queryForm.InputPallet = result.result;
		}
	}
}

