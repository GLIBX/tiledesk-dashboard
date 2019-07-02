import { Subscription } from 'rxjs/Subscription';
import { AnalyticsService } from './../../services/analytics.service';
import { Component, OnInit } from '@angular/core';
import { RequestsService } from 'app/services/requests.service';
import * as moment from 'moment';
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';
import { TranslateService } from '@ngx-translate/core';
import { ITooltipEventArgs } from '@syncfusion/ej2-heatmap/src';
import { Chart } from 'chart.js';
import { TransferState } from '@angular/platform-browser';

@Component({
  selector: 'appdashboard-panoramica',
  templateUrl: './panoramica.component.html',
  styleUrls: ['./panoramica.component.scss']
})
export class PanoramicaComponent implements OnInit {

  monthNames:any;
  lang:string;

  dataSource: Object;
  xAxis: Object;
  yAxis: Object;
  titleSettings: Object;
  cellSettings: Object;
  legendSettings: any; // nk
  paletteSettings: Object;
  customData = [];
  xlabel_ita = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  xlabel_eng = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  ylabel_ita = ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00']
  ylabel_eng = ['1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12am', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm', '12pm']
  weekday: any;
  hour: any;

  subscription:Subscription;

  constructor(  private requestsService:RequestsService,
                private translate: TranslateService,
                private analyticsService: AnalyticsService) {
                  
                  this.lang = this.translate.getBrowserLang();
                  console.log('LANGUAGE ', this.lang);
                  this.getBrowserLangAndSwitchMonthName();
                  this.getHeatMapSeriesDataByLang();
   }

  ngOnInit() {
    this.getRequestByLast7Day();
    this.heatMap();
    
  }

  ngOnDestroy() {
    console.log('!!! ANALYTICS - !!!!! UN - SUBSCRIPTION TO REQUESTS');
    this.subscription.unsubscribe();
  }

  goToRichieste(){
    console.log("User click on last 7 days graph");
    this.analyticsService.goToRichieste();
  }

  getHeatMapSeriesDataByLang(){
    
    if (this.lang === 'it') {
      this.weekday = { '1': 'Lun', '2': 'Mar', '3': 'Mer', '4': 'Gio', '5': 'Ven', '6': 'Sab', '7': 'Dom' }
      this.hour = {
        '0': '01:00', '1': '02:00', '2': '03:00', '3': '04:00', '4': '05:00', '5': '06:00', '6': '07:00', '7': '08:00', '8': '09:00', '9': '10:00',
        '10': '11:00', '11': '12:00', '12': '13:00', '13': '14:00', '14': '15:00', '15': '16:00', '16': '17:00', '17': '18:00', '18': '19:00', '19': '20:00',
        '20': '21:00', '21': '22:00', '22': '23:00', '23': '24:00'
      }
      this.yAxis = { labels: this.ylabel_ita };
      this.xAxis = { labels: this.xlabel_ita };
      
      this.titleSettings = {
        text: 'Utenti per ora del giorno',
        textStyle: {
          size: '15px',
          fontWeight: '500',
          fontStyle: 'Normal'
        }
      };

    } else {
      this.weekday = { '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun' }
      this.hour = {
        '0': '1am', '1': '2am', '2': '3am', '3': '4am', '4': '5am', '5': '6am', '6': '7am', '7': '8am', '8': '9am', '9': '10am',
        '10': '11am', '11': '12am', '12': '1pm', '13': '2pm', '14': '3pm', '15': '4pm', '16': '5pm', '17': '6pm', '18': '7pm', '19': '8pm',
        '20': '9pm', '21': '10pm', '22': '11pm','23': '12pm'
      }

      this.yAxis = { labels: this.ylabel_eng };
      this.xAxis = { labels: this.xlabel_eng };
      this.titleSettings = {
        text: 'User per hour of day',
        textStyle: {
          size: '15px',
          fontWeight: '500',
          fontStyle: 'Normal'
        }
      };

    }
  }
  getBrowserLangAndSwitchMonthName() {
    
    if (this.lang) {
      if (this.lang === 'it') {
        this.monthNames = { '1': 'Gen', '2': 'Feb', '3': 'Mar', '4': 'Apr', '5': 'Mag', '6': 'Giu', '7': 'Lug', '8': 'Ago', '9': 'Set', '10': 'Ott', '11': 'Nov', '12': 'Dic' }
      } else {
        this.monthNames = { '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr', '5': 'May', '6': 'Jun', '7': 'Jul', '8': 'Aug', '9': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' }
      }
    }
  }

  getMaxOfArray(requestsByDay_series_array) {
    return Math.max.apply(null, requestsByDay_series_array);
  }
  

  //-----------LAST 7 DAYS GRAPH-----------------------
  getRequestByLast7Day(){
    this.subscription=this.analyticsService.requestsByDay(7,null).subscribe((requestsByDay: any) => {
      console.log('»» !!! ANALYTICS - REQUESTS BY DAY ', requestsByDay);

      // CREATES THE INITIAL ARRAY WITH THE LAST SEVEN DAYS (calculated with moment) AND REQUESTS COUNT = O
      const last7days_initarray = []
      for (let i = 0; i <= 6; i++) {
        // console.log('»» !!! ANALYTICS - LOOP INDEX', i);
        last7days_initarray.push({ 'count': 0, day: moment().subtract(i, 'd').format('D-M-YYYY') })
      }

      

      last7days_initarray.reverse()

      console.log('»» !!! ANALYTICS - REQUESTS BY DAY - MOMENT LAST SEVEN DATE (init array)', last7days_initarray);

      const requestsByDay_series_array = [];
      const requestsByDay_labels_array = []

      // CREATES A NEW ARRAY FROM THE ARRAY RETURNED FROM THE SERVICE SO THAT IT IS COMPARABLE WITH last7days_initarray
      const requestsByDay_array = []
      for (let j = 0; j < requestsByDay.length; j++) {
        if (requestsByDay[j]) {
          requestsByDay_array.push({ 'count': requestsByDay[j]['count'], day: requestsByDay[j]['_id']['day'] + '-' + requestsByDay[j]['_id']['month'] + '-' + requestsByDay[j]['_id']['year'] })

        }

      }
      console.log('»» !!! ANALYTICS - REQUESTS BY DAY FORMATTED ', requestsByDay_array);


      /**
       * MERGE THE ARRAY last7days_initarray WITH requestsByDay_array  */
      // Here, requestsByDay_formatted_array.find(o => o.day === obj.day)
      // will return the element i.e. object from requestsByDay_formatted_array if the day is found in the requestsByDay_formatted_array.
      // If not, then the same element in last7days i.e. obj is returned.
      const requestByDays_final_array = last7days_initarray.map(obj => requestsByDay_array.find(o => o.day === obj.day) || obj);
      console.log('»» !!! ANALYTICS - REQUESTS BY DAY - FINAL ARRAY ', requestByDays_final_array);

      const _requestsByDay_series_array = [];
      const _requestsByDay_labels_array = [];

      requestByDays_final_array.forEach(requestByDay => {
        //console.log('»» !!! ANALYTICS - REQUESTS BY DAY - requestByDay', requestByDay);
        _requestsByDay_series_array.push(requestByDay.count)

        const splitted_date = requestByDay.day.split('-');
        //console.log('»» !!! ANALYTICS - REQUESTS BY DAY - SPLITTED DATE', splitted_date);
        _requestsByDay_labels_array.push(splitted_date[0] + ' ' + this.monthNames[splitted_date[1]])
      });


      console.log('»» !!! ANALYTICS - REQUESTS BY DAY - SERIES (ARRAY OF COUNT - to use for debug)', requestsByDay_series_array);
      console.log('»» !!! ANALYTICS - REQUESTS BY DAY - SERIES (+ NEW + ARRAY OF COUNT)', _requestsByDay_series_array);
      console.log('»» !!! ANALYTICS - REQUESTS BY DAY - LABELS (ARRAY OF DAY - to use for debug)', requestsByDay_labels_array);
      console.log('»» !!! ANALYTICS - REQUESTS BY DAY - LABELS (+ NEW + ARRAY OF DAY)', _requestsByDay_labels_array);

      const higherCount = this.getMaxOfArray(_requestsByDay_series_array);
      console.log('»» !!! ANALYTICS - REQUESTS BY DAY - HIGHTER COUNT ', higherCount);

      let lang=this.lang;

      var lineChart = new Chart('last7dayChart', {
        type: 'line',
        data: {
          labels: _requestsByDay_labels_array ,
          datasets: [{
            label: 'Number of request in last 7 days ',//active labet setting to true the legend value
            data: _requestsByDay_series_array,
            fill: true, //riempie zona sottostante dati
            lineTension: 0.0,
            backgroundColor: 'rgba(30, 136, 229, 0.6)',
            borderColor: 'rgba(30, 136, 229, 1)',
            borderWidth: 3,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: 'rgba(255, 255, 255, 0.8)',
            pointBorderColor: '#1e88e5'

          }]
        },
        options: {
          maintainAspectRatio:false, //allow to resize chart
          title: {
            text: 'AVERAGE TIME RESPONSE',
            display: false
          },
          legend:{
            display:false //do not show label title
          },
          scales: {
            xAxes: [{
              ticks: {
                beginAtZero: true,
                display: true,
                //minRotation: 30,
                fontColor: 'black',

              },
              gridLines: {
                display: true,
                borderDash:[8,4],
                //color:'rgba(255, 255, 255, 0.5)',
                
              }

            }],
            yAxes: [{
              gridLines: {
                display: true ,
                borderDash:[8,4],
                //color:'rgba(0, 0, 0, 0.5)',
                
              },
              ticks: {
                beginAtZero: true,
                userCallback: function(label, index, labels) {
                  //userCallback is used to return integer value to ylabel
                  if (Math.floor(label) === label) {
                      return label;
                  }
                },
                display: true,
                fontColor: 'black',
                suggestedMax: higherCount + 2,
                
        
                // callback: function (value, index, values) {
                //   let hours = Math.floor(value / 3600000) // 1 Hour = 36000 Milliseconds
                //   let minutes = Math.floor((value % 3600000) / 60000) // 1 Minutes = 60000 Milliseconds
                //   let seconds = Math.floor(((value % 360000) % 60000) / 1000) // 1 Second = 1000 Milliseconds
                //   return hours + 'h:' + minutes + 'm:' + seconds + 's'
                // },

              }
            }]
          },
          tooltips: {
            callbacks: {
              label: function (tooltipItem, data) {
                
                      
                // var label = data.datasets[tooltipItem.datasetIndex].label || '';
                // if (label) {
                //     label += ': ';
                // }
                // label += Math.round(tooltipItem.yLabel * 100) / 100;
                // return label + '';
                //console.log("data",data)
                const currentItemValue = tooltipItem.yLabel
                // let langService = new HumanizeDurationLanguage();
                // let humanizer = new HumanizeDuration(langService);
                // humanizer.setOptions({ round: true })
                //console.log("humanize", humanizer.humanize(currentItemValue))
                //return data.datasets[tooltipItem.datasetIndex].label + ': ' + currentItemValue
                if(lang==='it'){
                  return 'Richieste: '+currentItemValue;
                }else{
                  return 'Request:' +currentItemValue;
                }

              }
            }
          }
          
        }
        ,
        plugins:[{
          beforeDraw: function(chartInstance, easing) {
            var ctx = chartInstance.chart.ctx;
            //console.log("chartistance",chartInstance)
            //ctx.fillStyle = 'red'; // your color here
            ctx.height=128
            //chartInstance.chart.canvas.parentNode.style.height = '128px';
            ctx.font="Google Sans"
            var chartArea = chartInstance.chartArea;
            //ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
          }
        }]
      });


    }, (error) => {
      console.log('»» !!! ANALYTICS - REQUESTS BY DAY - ERROR ', error);
    }, () => {
      console.log('»» !!! ANALYTICS - REQUESTS BY DAY * COMPLETE *');
    });
  }

  heatMap() {

    // get the language of browser
    
    this.cellSettings = {
      border: {
        radius: 4,
        width: 1,
        color: 'white'
      },
      // tileType:'Bubble',
      // bubbleType: 'Size',
      showLabel: false, // set to true to show value over each block
      // format: '{value} M',
    };

    this.paletteSettings = {
      palette: [
        { color: '#a0d4e9' },
        { color: '#5fa3f1' },
        { color: '#5187ed' },
        { color: '#254594' }
      ],
    };


    this.analyticsService.getDataHeatMap().subscribe(res => {
      let data:object= res;
      console.log('data from servoice->', res);
      // let init_array=[];
      // if(res.length==0){
        
      //   for(let i=1;i<8;i++) {
      //     init_array.push({ '_id': { "hour": this.xlabel_ita[i], "weekday": this.ylabel_ita[i] }, 'count': 0 })
      //   }
      // data=init_array;
      // console.log("init_array",init_array)
        
      // }

      
      const initialArray=[];
      for(let i=0;i<24;i++){
        
        for(let j=1;j<8;j++){
          initialArray.push({ '_id': { 'hour': this.hour[i], 'weekday': this.weekday[j] }, 'count': null })
        }
        
      }
      console.log("INITIALLLL",initialArray);
      

      // recostruct datafromservice to other customDataJson
      for (let z in data) {

        this.customData.push({ '_id': { "hour": this.hour[data[z]._id.hour], "weekday": this.weekday[data[z]._id.weekday] }, 'count': data[z].count });
      }

      console.log('CUSTOM', this.customData);

      //map customdata to initial array to create filanArray by _id.hour & _id.weekday values
      const finalArray = initialArray.map(obj => this.customData.find(o => (o._id.hour === obj._id.hour)&&(o._id.weekday === obj._id.weekday)) || obj);
      console.log("FINAL",finalArray)

      this.dataSource = {
        data: finalArray,
        isJsonData: true,
        adaptorType: 'Cell',
        yDataMapping: '_id.hour',
        xDataMapping: '_id.weekday',
        valueMapping: 'count'
      }
    }, (error) => {
      console.log('»» !!! ANALYTICS - REQUESTS HEATMAP - ERROR ', error);
    }, () => {
      console.log('»» !!! ANALYTICS - REQUESTS HEATMAP * COMPLETE *');
    })

  }

  public tooltipRender(args: ITooltipEventArgs): void {
    args.content = [args.xLabel + ' | ' + args.yLabel + ' : ' + args.value];
  };

  public showTooltip: Boolean = true;















}
