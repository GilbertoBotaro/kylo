import * as moment from "moment";
import * as _ from "underscore";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import {OperationsRestUrlConstants} from "./operations-rest-url-constants";
import {OperationsFeedUtil} from "./operations-feed-util";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {TdDialogService} from "@covalent/core/dialogs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FeedSummary} from "../feed-mgr/model/feed/feed-summary.model";
import {Observable} from "rxjs/Observable";
import {RestUrlConstants} from "../feed-mgr/services/RestUrlConstants";

@Injectable()
export class OpsManagerFeedService {
    FEED_HEALTH_URL: string = OperationsRestUrlConstants.FEED_HEALTH_URL;
    FEED_HEALTH_COUNT_URL: string =  OperationsRestUrlConstants.FEED_HEALTH_COUNT_URL;

    DAILY_STATUS_COUNT_URL:string = OperationsRestUrlConstants.DAILY_STATUS_COUNT_URL

    FEED_DAILY_STATUS_COUNT_URL = OperationsRestUrlConstants.FEED_DAILY_STATUS_COUNT_URL

    FETCH_FEED_HEALTH_INTERVAL: number = 5000;
    /***
     * the refresh interval to fetch for feed health data
     * @type {null}
     */
    fetchFeedHealthInterval: any = null;
    /**
     * The map of health data
     * @type {{}}
     */
    feedHealth: any = {};
    /**
     * the map of feed summary data
     * @type {{}}
     */
    feedSummaryData: any = {};
    /**
     * total unhealthy feeds
     * @type {number}
     */
    feedUnhealthyCount: number = 0;
    /**
     * total healthly feeds
     * @type {number}
     */
    feedHealthyCount: number = 0;

    constructor(
        private http : HttpClient, private _dialogService:TdDialogService, private snackBar: MatSnackBar){

    }
    emptyFeed () {
        var feed: any = {};
        feed.displayStatus = 'LOADING';
        feed.lastStatus = 'LOADING',
            feed.timeSinceEndTime = 0;
        feed.isEmpty = true;
        return feed;
    }
/**
    decorateFeedSummary (feed: any) {
        if (feed.isEmpty == undefined) {
            feed.isEmpty = false;
        }
        var health: string = "---";
        if (!feed.isEmpty) {
            health = feed.healthy ? 'HEALTHY' : 'UNHEALTHY';
            var iconData: any = IconU.iconForFeedHealth(health);
            feed.icon = iconData.icon
            feed.iconstyle = iconData.style
        }
        feed.healthText = health;
        if (feed.running) {
            feed.displayStatus = 'RUNNING';
        }
        else if ("FAILED" == feed.lastStatus || ( "FAILED" == feed.lastExitCode && "ABANDONED" != feed.lastStatus)) {
            feed.displayStatus = 'FAILED';
        }
        else if ("COMPLETED" == feed.lastExitCode) {
            feed.displayStatus = 'COMPLETED';
        }
        else if ("STOPPED" == feed.lastStatus) {
            feed.displayStatus = 'STOPPED';
        }
        else if ("UNKNOWN" == feed.lastStatus) {
            feed.displayStatus = 'INITIAL';
            feed.sinceTimeString = '--';
            feed.runTimeString = "--"
        }
        else {
            feed.displayStatus = feed.lastStatus;
        }

        feed.statusStyle = this.iconService.iconStyleForJobStatus(feed.displayStatus);
    }
**/
    fetchFeedSummaryData () {
        var successFn =  (response: any)=> {
            this.feedSummaryData = response;
            if (response) {
                this.feedUnhealthyCount = response.failedCount;
                this.feedHealthyCount = response.healthyCount;
            }
        }
        var errorFn =  (err: any)=>{

        }
        var finallyFn =  ()=>{

        }

        var promise = this.http.get(this.FEED_HEALTH_URL).toPromise();
        promise.then(successFn, errorFn);
        return promise;
    };

    fetchFeedHealth () {
        var successFn =  (response: any)=> {

            var unhealthyFeedNames: any[] = [];
            if (response) {
                response.forEach((feedHealth: any)=> {
                    if (this.feedHealth[feedHealth.feed]) {
                        this.feedHealth[feedHealth.feed] = _.extend(this.feedHealth[feedHealth.feed], feedHealth);
                    }
                    else {
                        this.feedHealth[feedHealth.feed] = feedHealth;
                    }
                    if (feedHealth.lastUnhealthyTime) {
                        feedHealth.sinceTimeString =  moment(feedHealth.lastUnhealthyTime).fromNow();
                    }
                    if (feedHealth.healthy) {
                    }
                    else {
                        unhealthyFeedNames.push(feedHealth.feed);
                    }
                });
            }
            this.fetchFeedHealthTimeout();
        }
        var errorFn =  (err: any)=> {
            this.fetchFeedHealthTimeout();
        }
        var finallyFn =  ()=> {

        }

        var promise = this.http.get(this.FEED_HEALTH_COUNT_URL).toPromise();
        promise.then(successFn, errorFn);
        return promise;
    };

    startFetchFeedHealth (){
        if (this.fetchFeedHealthInterval == null) {
            this.fetchFeedHealth();

            this.fetchFeedHealthInterval = setInterval( () =>{
                this.fetchFeedHealth();
            }, this.FETCH_FEED_HEALTH_INTERVAL)
        }
    };

    fetchFeedHealthTimeout () {
        this.stopFetchFeedHealthTimeout();

        this.fetchFeedHealthInterval = setTimeout( () =>{
            this.fetchFeedHealth();
        }, this.FETCH_FEED_HEALTH_INTERVAL);
    }

    stopFetchFeedHealthTimeout() {
        if (this.fetchFeedHealthInterval != null) {
            clearTimeout(this.fetchFeedHealthInterval);
        }
    }

    getFeedHealth(feedName:string){
        let subject = new ReplaySubject(1);

        var successFn = (response: any)=> {
            let feedHealth = {};
            if (response) {
                //transform the data for UI
                //this.feedData = response;

                if (response.feedSummary && response.feedSummary.length && response.feedSummary.length >0) {
                     feedHealth = response.feedSummary[0];
                    OperationsFeedUtil.decorateFeedSummary(feedHealth);
                    feedHealth = feedHealth
                }
            }
            subject.next(feedHealth)
        }
        var errorFn =  (err: any)=> {
            subject.error(err)
        }
        this.http.get(OperationsRestUrlConstants.SPECIFIC_FEED_HEALTH_URL(feedName)).subscribe( successFn, errorFn);
        return subject.asObservable();
    }

    public openSnackBar(message:string, duration?:number){
        if(duration == undefined){
            duration = 3000;
        }
        this.snackBar.open(message, null, {
            duration: duration,
        });
    }


    enableFeed(feedId:string) :Observable<FeedSummary>{
    let observable:Observable<FeedSummary> =   <Observable<FeedSummary>>  this.http.post(RestUrlConstants.ENABLE_FEED_URL(feedId),null);
    observable.subscribe((response:FeedSummary)=> {
            //no op

        },error1 => {
            this._dialogService.openAlert({
                title:"Error enabling the feed",
                message:"The feed could not be enabled."
            });
        });
    return observable;
    }

    disableFeed(feedId:string) :Observable<FeedSummary>{
        let observable:Observable<FeedSummary> =  <Observable<FeedSummary>>   this.http.post(RestUrlConstants.DISABLE_FEED_URL(feedId),null);
        observable.subscribe((response:FeedSummary)=> {
            //no op

        },error1 => {
            this._dialogService.openAlert({
                title:"Error disabling the feed",
                message:"The feed could not be disabled."
            });
        });
        return observable;
    }

    /**
     *
     this.enableFeed = function() {
        if(!self.enabling && self.allowEdit) {
            self.enabling = true;
            $http.post(RestUrlService.ENABLE_FEED_URL(self.feedId)).then(function (response:any) {
                self.model.state = response.data.state;
                FeedService.updateEditModelStateIcon();
                self.enabling = false;
            }, function () {
                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title("NiFi Error")
                        .textContent("The feed could not be enabled.")
                        .ariaLabel("Cannot enable feed.")
                        .ok("OK")
                );
                self.enabling = false;
            });
        }
    };

     this.disableFeed = function() {
        if(!self.disabling && self.allowEdit) {
            self.disabling = true;
            $http.post(RestUrlService.DISABLE_FEED_URL(self.feedId)).then(function (response:any) {
                self.model.state = response.data.state;
                FeedService.updateEditModelStateIcon();
                self.disabling = false;
            }, function () {
                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title("NiFi Error")
                        .textContent("The feed could not be disabled.")
                        .ariaLabel("Cannot disable feed.")
                        .ok("OK")
                );
                self.disabling = false;
            });
        }
    };

     this.startFeed = function() {
        if (!self.startingFeed && self.allowStart) {
            self.startingFeed = true;
            $http.post(RestUrlService.START_FEED_URL(self.feedId)).then(function (response:any) {
                let msg = "Feed started";
                if(response && response.data && response.data.message) {
                    msg = response.data.message;
                }
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(msg)
                        .hideDelay(3000)
                );
                self.startingFeed = false;
            }, function (response : any) {
                let msg = "The feed could not be started.";
                if(response && response.data && response.data.message) {
                    msg +="<br/><br/>"+response.data.message;
                }
                console.error("Unable to start the feed ",response);
                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title("Error starting the feed")
                        .htmlContent(msg)
                        .ariaLabel("Cannot start feed.")
                        .ok("OK")
                );
                self.startingFeed = false;
            });
        }
    };



     */
}