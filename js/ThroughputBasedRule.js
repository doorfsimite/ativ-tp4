/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

var ThroughputBasedRule;

// Rule that selects the lowest possible bitrate
function ThroughputBasedRuleClass() {

    let factory = dashjs.FactoryMaker;
    let SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    let MetricsModel = factory.getSingletonFactoryByName('MetricsModel');
    let StreamController = factory.getSingletonFactoryByName('StreamController');
    let DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    let DashManifestModel = factory.getSingletonFactoryByName('DashManifestModel');
    let context = this.context;
    let instance;

    function setup() {
    }

    // Always use lowest bitrate
    function getMaxIndex(rulesContext) {
        //Get metrics
        let dashMetrics = DashMetrics(context).getInstance();
        let mediaType = rulesContext.getMediaInfo().type;
        let currentBufferLevel = dashMetrics.getCurrentBufferLevel(mediaType);
        // console.log('currentBufferLevel: ' + currentBufferLevel);
        let currentRequest = dashMetrics.getCurrentHttpRequest(mediaType);
        // console.log('currentReuquest: ' + JSON.stringify(currentRequest));

        // Get list of qualitys do video e audio ( 0 , 4 no caso)
        let abrController = rulesContext.getAbrController();
        const mediaInfo = rulesContext.getMediaInfo();
        let bitrateList = abrController.getBitrateList(mediaInfo);
        // console.log('bitrateList: ' + JSON.stringify(bitrateList));

        // Get Bandwidth current representation (largura de banda pra baixar cada segmento)
        let dashManifest = DashManifestModel(context).getInstance();
        let currentRepresentation = rulesContext.getRepresentationInfo();
        let currentBandWidth = dashManifest.getBandwidth(currentRepresentation)
        // console.log('currentBandWidth: '+currentBandWidth);

        // Get Throughput (vazão média do canal nos últimos 3 segmentos)
        let throughputHistory = abrController.getThroughputHistory();
        let streamInfo = rulesContext.getStreamInfo();
        let isDynamic = streamInfo && streamInfo.manifestInfo && streamInfo.manifestInfo.isDynamic;
        let throughput = throughputHistory.getAverageThroughput(mediaType, isDynamic) * 1000;
        // console.log('throughput: '+throughput);

        // vazão atenuada
        let safeThroughput = throughputHistory.getSafeAverageThroughput(mediaType, isDynamic) * 1000;
        // console.log('safeThroughput: '+safeThroughput);

        //latencia em milisegundos
        let latency = throughputHistory.getAverageLatency(mediaType) * 1000;
        console.log('latency: ' + latency);

        count = rulesContext.getMediaInfo().representationCount;
        quality = Math.floor(Math.random() * count);
        console.log('quality: ' + quality);


        // Ask to switch to the lowest bitrate
        let switchRequest = SwitchRequest(context).create();
        switchRequest.quality = quality;
        switchRequest.reason = 'Always switching to the lowest bitrate';
        switchRequest.priority = SwitchRequest.PRIORITY.STRONG;
        return switchRequest;
    }

    instance = {
        getMaxIndex: getMaxIndex
    };

    setup();

    return instance;
}

ThroughputBasedRuleClass.__dashjs_factory_name = 'ThroughputBasedRule';
ThroughputBasedRule = dashjs.FactoryMaker.getClassFactory(ThroughputBasedRuleClass);
