var html5QrCode = null;
var app = new Vue({
	el: '#app',
	data:{
		params: GX.getParameters(),
		convertKeys:{
			ReqQty:'quantity2'
		},
		rows:{
			'Query':[1],
			'itemNoListQuery':[],
			WorkCenterList:[],
			InputProductInfoList:[]
			
		},
		
		BottleNo:'',

		LotNo:'',
		StdUnitQty:0,
		Qty:0,
		focusRowIndex:-1,

		queryForm:{
			Date: '',
			WorkCenterSeq: '',
		},
		QtyData:{
			ItemName:'',
			Qty:'',
			InvQty:''
		},
		itemData:{
			ItemName:'',
			ItemNo:'',
			ItemSeq: 0,
			Result:'',
			Spec:'',
			Status:0,
			UnitSeq:''
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

		search: function(){
			const vThis = this;
			let params = this.params;
			console.log(params);
			// WorkOrderSeq:0,
			// WorkOrderSerl: 0,
			// IsItem: '0',
			// ProcSeq: 0,
			GX._METHODS_
			.setMethodId('Genuine.enModuleName.BisMatInPutPDA_en/MatInPutQuery2_2O')
			.ajax([params], [function(data){
				console.log(data);

				if(data != null && data[0] != null){
					for(let i in data){
						if(data.hasOwnProperty(i)){
							data[i].Qty = '';
						}
					}
					vThis.rows.InputProductInfoList = data;
				}
			}], true);

		},
		inputTypeNumber: function(){
			
			if(event.keyCode == 13) {
				var prevented = event.target.dispatchEvent(new Event("blur")); // Fire even
				//event.target.blur();
				event.preventDefault();

				
			}
			GX.inputTypeNumberEventHandler(event);
		},
		sumQty: function(){
			let Qty = 0;
			for(let i in this.rows.InputProductInfoList){
				if(this.rows.InputProductInfoList.hasOwnProperty(i)){
					Qty += Number(this.rows.InputProductInfoList[i].Qty);
				}
			}

			this.Qty = Qty;
			//if(event.keyCode == 13) alert(event.keyCode)
			event.preventDefault();
		},
		checkFocus: function(index){
			return Number(this.focusRowIndex)==Number(index);
		},
		focusBottleNo: function(index){
			document.querySelectorAll('[name="BottleNo"]')[index].closest('td').className = '';
			document.querySelectorAll('[name="Qty"]')[index].closest('td').className = '';
			this.focusRowIndex = index;
		},
		blurBottleNo: function(index){
			document.querySelectorAll('[name="BottleNo"]')[index].closest('td').className = 'code-help';
			document.querySelectorAll('[name="Qty"]')[index].closest('td').className = 'code-help';
			this.focusRowIndex = -1;
		},
		check: function(){
			const vThis = this;
			let params = this.params;
			params.BottleNo = this.BottleNo;

			GX._METHODS_
			.setMethodId('Genuine.enModuleName.BisMatInPutPDA_en/MatInPutBarCodeCheck2')
			.ajax([params], [function(data){
				if(data[0] != null){
					if(data[0].Status == 0) {
						for(let i in vThis.rows.InputProductInfoList){
							if(vThis.rows.InputProductInfoList.hasOwnProperty(i)){
								if(vThis.rows.InputProductInfoList[i].BottleNo == vThis.BottleNo){
									vThis.focusRowIndex = i;
									vThis.focusBottleNo(i);
									break;
								}
							}
						}
					}
					else if(data[0].Result != null) alert(data[0].Result);
				}
				else alert('API에서 반환된 결과에 오류가 있습니다.');

			}], false);
		},
		save: function(){
			const vThis = this;
			let params = [];
			for(let i in this.rows.InputProductInfoList){
				if(this.rows.InputProductInfoList.hasOwnProperty(i)){
					if (Number(this.rows.InputProductInfoList[i].Qty) > 0) {
						this.rows.InputProductInfoList[i].EmpSeq = GX.Cookie.get('EmpSeq');
						this.rows.InputProductInfoList[i].UserSeq = GX.Cookie.get('UserSeq');
						this.rows.InputProductInfoList[i].DeptSeq = GX.Cookie.get('DeptSeq');
						this.rows.InputProductInfoList[i].BizUnit = GX.Cookie.get('BizUnit');
						params.push(this.rows.InputProductInfoList[i]);
					}
				}
			}

			if(params.length > 0){
				GX._METHODS_
				.setMethodId('Genuine.enModuleName.BisMatInPutPDA_en/MatInPutSave2_1O')
				.ajax(params, [function(data){
					console.log(data);

					if(data[0] != null){
						if(data[0].Status == 0) history.back(); // 초기화
						else if(data[0].Result != null) alert(data[0].Result);
					}
					else alert('API에서 반환된 결과에 오류가 있습니다.');

				}], true);

			}
			else alert('입력된 투입 수량이 없습니다.');

		},
		init: function(){
			this.Qty = 0;
			this.search();
		},

		scanBarCode: function(){
			var vThis = this;
			let clipboardData = event.clipboardData || window.clipboardData;
			if(clipboardData != null){
				let QRCodeData = clipboardData.getData('Text');
				let activeObjName = '';
				let activeTabIdx = '';
				let isFocused = (document.querySelector('input:focus') != null);
				let isChange = '';
				
				let scannerObj = document.querySelectorAll('[gx-scanner="Y"]');
				
				this.BottleNo = QRCodeData.replaceAll(' ', '');

				this.check();
				//vThis.bottleSel();


				//event.preventDefault();
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
		GX.NumberType.init(GX._DATAS_.convertRules);
		this.search();
	},
	created(){
		if(!GX._METHODS_.isLogin()) location.replace('login.html');
		else {
			const vThis = this;
			//GX.SpinnerBootstrap.init();
			GX.SpinnerBootstrap.init('loading', 'loading-wrap', '<div class="container"><img src="img/loading.gif" alt=""><span>처리중입니다...</span></div>');

			this.StdUnitQty = this.params.StdUnitQty;

			GX.VueGrid
			.init()
			.bodyRow(':class="{\'guide-row\': checkFocus(index)}"')
			.item('BottleNo').head('용기번호', '')
			.body('<input type="text" name="BottleNo" v-model="row.BottleNo" gx-scanner="Y" readonly="readonly" style="color:#000000;">', 'code-help')
			
			.item('LotNo').head('LotNo', 'text-c')
			.item('StockQty').head('재고', 'text-r')
			.item('Qty').head('투입', 'text-r')
			.body('<input type="text" name="Qty" v-model="row.Qty" @blur="blurBottleNo(index);" @keydown="inputTypeNumber();" @keyup="inputTypeNumber();" @input="sumQty();">', 'code-help')
			.loadTemplate('#grid', 'rows.InputProductInfoList');

			// if(this.params.QryType != null && this.params.QryType == 'Query') this.search(this.params);

			// select box에 scannr enter evnet 막기 시작 /////////////
			GX.SelectBoxEnterPrevention.init();
			// select box에 scannr enter evnet 막기 끝 /////////////

			// 스캐너 입력이 하나인 경우 포커스 없이도 해당 스캔 입력박스에 스캔값 입력처리를 위한 이벤트
			document.body.addEventListener('paste', this.scanBarCode, false);

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

