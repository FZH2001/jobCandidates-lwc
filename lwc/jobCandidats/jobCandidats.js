import { LightningElement, wire, api,track } from 'lwc';
import getCandidatesByJob from '@salesforce/apex/CandidatsFilter.getCandidatesByJob';
import getRequirementsGroupedByType from '@salesforce/apex/CandidatsFilter.getRequirementsGroupedByType';
import { NavigationMixin } from 'lightning/navigation';
import {ShowToastEvent} from "lightning/platformShowToastEvent";
import {refreshApex} from '@salesforce/apex';


export default class JobCandidats extends LightningElement {
    @api recordId;
    @track requirements = [];
    @track candidates =  [];
    wiredCandidates =  [];
    mappedCandidates =  [];

    @track underscoredCandidates =  [];
    pageSize=4;
    isNextDisabled=true;
    isPrevDisabled=true;
    pageNumber=1;
    @track showModal = false;
    showScreenFlowModal = false;

    underscoredPageNumber=1;
    underscoredPageSize=4;
    underscoredIsNextDisabled=true;
    underscoredIsPrevDisabled=true;

   inputVariables = [];
    renderFlow = false;
   getButtonClass(status) {
        return status === 'Schedule Interviews' ? 'slds-button slds-button_brand slds-theme_success' : 'slds-button slds-button_brand slds-theme_primary';
    }
    submitFlow(event){
        //Create an Array to pass to the Flow
        this.inputVariables = [
           {
               name: 'jobAppId',
               type: 'String',
               value: event.target.dataset.candidateId
           },
            {
               name: 'status',
               type: 'String',
               value: event.target.dataset.status
           },
           ];
        console.log(' i submitted the data to the flow');
        this.renderFlow = true;
        console.log('the accept variable is ', event.target.dataset.accepted)
        this.candidates.map((data)=>{
        if(data.Id===event.target.dataset.candidateId  && event.target.dataset.accepted==='true'){
            data.Status__c='Schedule Interviews'
        }
        if(data.Id===event.target.dataset.candidateId && event.target.dataset.accepted==='false'){
            data.Status__c='Resume reviewed'

        }
        })
    } 
    rejectCandidates(event){

    }
    showReject(status){
        if(status==='Rejected'){
            return false;}
            else {return true;}
        }

   handleStatusChange(event){
            if (event.detail.status === 'FINISHED_SCREEN') {
                console.log('i am done in FINISHED_SCREEN');
                refreshApex(this.wiredCandidates);

                this.fireSuccessToast();

                //Hide the Flow again
                this.renderFlow = false;

                //reset the input variables

            }
            else{
                    console.log('i am not done');

            }
        }
       fireSuccessToast(){
       const evt = new ShowToastEvent({
           title: "Success",
           message: 'Job application has successfully been updated !',
           variant: "success",
       });
       this.dispatchEvent(evt);
   }




    columnsList = [
        {
            label: 'Name',
            type: 'button',
            fieldName: 'Name',
            typeAttributes: {
                label: { fieldName: 'Name' },
                name: 'view_candidate',
                title: 'View Candidate',
                variant: 'base',
            },
        },
        { label: 'Email', fieldName: 'Email', type: 'email' },
        { label: 'Score', fieldName: 'Score__c' ,type : 'text'},
        // Add more columns as needed
    ];
    // connectedCallback() { 
    //     console.log('OUTPUT : ',this.recordId);
    //     console.log('OUTPUT : ',this.candidates);
    // }

    connectedCallback() {
        getRequirementsGroupedByType()
            .then(R => {
                this.requirements = Object.values(R)
                console.log('OUTPUT : ',Object.values(R));
            })
            .catch(error => {
                // Handle any errors
                console.error('Error calling Apex:', error);
            });

         //   this.submitFlow();
           

    }

    @wire(getCandidatesByJob, { jobId: '$recordId' })
    wiredCandidates(result) {
        this.wiredCandidates=result;
        if (result.data) {
            console.log(result.data);
            this.mappedCandidates = result.data.map((app) => ({
                Id: app.Id,
                'appName' : app.Name,
                'LeadLink' : 'https://nbs-5e-dev-ed.develop.lightning.force.com/lightning/r/Lead/' + app.Candidate__c + '/view',
                'JobLink' : 'https://nbs-5e-dev-ed.develop.lightning.force.com/lightning/r/Job_Application__c/' + app.Id + '/view',
                'Name': app.Candidate__r.Name,
                'Email': app.Candidate__r.Email,
                'Score__c' : Math.round(app.Score__c * 10) / 10,
                'Status__c' : app.Status__c ,
                'Phone' : app.Candidate__r.Phone,
                'Score' : 0,
                'hard_skills__c' : app.Candidate__r.hard_skills__c ? app.Candidate__r.hard_skills__c.split('/n').join('/').toLowerCase() : [],
                'soft_skills__c' : app.Candidate__r.soft_skills__c ? app.Candidate__r.soft_skills__c.split('\n').join('/').toLowerCase() : [],
                'languages__c' : app.Candidate__r.languages__c ? app.Candidate__r.languages__c.split('\n').join('/').toLowerCase() : [],
                'isAccepted': false,
                'showAccept':app.Status__c ==='Schedule Interviews',
                'showReject': app.Status__c ==='Rejected'
            }));
            this.isNextDisabled = this.mappedCandidates.filter(e=>e.Status__c==='New'|e.Status__c==='Schedule Interviews').length < this.pageSize;
            console.log('waaaaaa',this.mappedCandidates.filter(e=>e.Status__c==='New'|e.Status__c==='Schedule Interviews').length < this.pageSize);
           this.isPrevDisabled = this.pageNumber === 1;
            this.candidates = this.mappedCandidates.filter(e=>e.Status__c==='New'|e.Status__c==='Schedule Interviews').slice(
            (this.pageNumber - 1) * this.pageSize,
            this.pageNumber * this.pageSize
            );


            this.underscoredIsNextDisabled = this.mappedCandidates.filter(e=>e.Status__c==='Underscored'|e.Status__c==='Resume reviewed').length < this.underscoredPageSize;
            console.log('waaaaaa',this.mappedCandidates.filter(e=>e.Status__c==='Underscored'|e.Status__c==='Resume reviewed').length < this.underscoredPageSize);
           this.underscoredIsPrevDisabled = this.underscoredPageNumber === 1;
            this.underscoredCandidates = this.mappedCandidates.filter(e=>e.Status__c==='Underscored'|e.Status__c==='Resume reviewed').slice(
            (this.underscoredPageNumber - 1) * this.underscoredPageSize,
            this.underscoredPageNumber * this.underscoredPageSize
            );


        //    this.updatePaginationButtons();

            this.mappedCandidates.forEach(cand => {
                //TODO : currentItem
                console.log('OUTPUT : ',cand.showReject);





                // if (cand.Status__c === 'Underscored' || cand.Status__c === 'Rejected' || cand.Status__c === 'Resume reviewed') {
                //     this.underscoredCandidates.push(cand);
                // } else {
                //     this.candidates.push(cand);
                // }
            });
           this.candidates.sort((a, b) => b.Score__c - a.Score__c);
            this.underscoredCandidates.sort((a, b) => b.Score__c - a.Score__c);
            // this.underscoredCandidates=this.candidates.filter((cand)=>{    
            //     return cand.Status__c === 'Underscored' || cand.Status__c === 'Rejected';
            // })

        } else if (result.error) {
            console.error('Error fetching candidates:',this.recordId, error);
        }
    }

    handleCheckboxChange(event) {
        if(event.target.checked){
            event.target.parentElement.nextElementSibling.style.display = 'block'
        }else{
            event.target.parentElement.nextElementSibling.style.display = 'none'
        }
    }
    handleAcceptClick(event){

    }
 
    openModal() {
        this.showScreenFlowModal = true;
    }
 
    closeModal() {
        this.showScreenFlowModal = false;
    }


    get modalClass() {
        return `slds-modal slds-fade-in-${this.showModal ? 'open' : 'hide'}`;
    }

    get backdropClass() {
        return `slds-backdrop ${this.showModal ? 'slds-backdrop_open' : ''}`;
    }

    openModal(event) {
        this.picklistValue = event.target.dataset.type
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }


    handleSubmit(event) {
        event.preventDefault();
        const form = event.target;
        console.log('OUTPUT : ',form);
        console.log('OUTPUT : ',event.detail.fields.Name);
        console.log('OUTPUT : ',event.detail.fields.type__c);
        this.requirements.forEach(
            (e) =>{
                if(e[0].type__c == event.detail.fields.type__c){
                    console.log('OUTPUT : ',e);
                    e.push({
                       Name :  event.detail.fields.Name,
                       type__c :  event.detail.fields.type__c,
                       Id :  Date.now()
                    })
                    console.log('OUTPUT : ',e);
                }

                });
        form.submit();
        this.closeModal();
    }


    async setCandidates(){
    const result = await  getCandidatesByJob ( { jobId: this.recordId });
     this.candidates = result.map((app) => ({
                Id: app.Id,
                'Name': app.Candidate__r.Name,
                'Email': app.Candidate__r.Email,
                'Score__c' : Math.round(app.Score__c * 10) / 10,
                'Status__c' : app.Status__c ,
                'Phone' : app.Candidate__r.Phone,
                // Add more fields from the Candidate object as needed
            }));
            this.candidates.sort((a, b) => b.Score__c - a.Score__c);

    }

 processString(inputString) {
    var splitValues = inputString.split('\n');
    var concatenatedString = splitValues.join('/');
    return concatenatedString;
}
    applyFilter(){
        const selectedFilters = []
        const checkboxes = this.template.querySelectorAll('input[name="filters"]:checked');
        checkboxes.forEach(checkbox  => {
            selectedFilters.push({
            'value' :  checkbox.value,
            'type'  :  checkbox.getAttribute('data-requirement-type'),
            'importance': checkbox.parentElement.nextElementSibling.firstElementChild.firstElementChild.firstElementChild.value
            })
            //TODO : currentItem
        });
        this.candidates.forEach(candidate => {
            // console.log('OUTPUT : ',candidate.hard_skills__c);
            candidate.Score =  0; // Initialize score if not present
            selectedFilters.forEach(selectedFilter => {
                if (candidate.hard_skills__c.includes(selectedFilter.value.toLowerCase()) ||
                    candidate.soft_skills__c.includes(selectedFilter.value.toLowerCase()) ||
                    candidate.languages__c.includes(selectedFilter.value.toLowerCase())) {
                        candidate.Score += parseInt(selectedFilter.importance);
                    // Add a break statement here if you want to prevent multiple additions
                }
            });
        });

        this.candidates.sort((a, b) => b.Score - a.Score);
    }


    resetFilter() {
        const checkboxes = this.template.querySelectorAll('input[name="filters"]:checked');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.parentElement.nextElementSibling.style.display = 'none';
        });

        this.candidates = this.candidates.map(candidate => ({ ...candidate, Score: 0 }));
        this.candidates.sort((a, b) => b.Score__c - a.Score__c);
    }
    updatePaginationButtons() {
    const totalPages = Math.ceil(this.candidates.length / this.pageSize);
    this.isNextDisabled = this.pageNumber >= totalPages;
    this.isPrevDisabled = this.pageNumber === 1;
}
handleNextPage() {
    const totalPages = Math.ceil(this.mappedCandidates.filter(e=>e.Status__c==='Scheduled Interviews'||e.Status__c==='New').length / this.pageSize);
    if (this.pageNumber <= totalPages) {
        ++this.pageNumber;
        this.isLoading = true; // Show loading spinner
        // Call the wired function again to fetch data for the next page
            this.candidates = this.mappedCandidates.filter(e=>e.Status__c==='Schedule Interviews'|e.Status__c==='New').slice(
            (this.pageNumber - 1) * this.pageSize,
            this.pageNumber * this.pageSize
            );

     //   refreshApex(this.wiredCandidates);
            this.isNextDisabled = this.candidates.length < this.pageSize;
            this.isPrevDisabled = this.pageNumber === 1;
    }
}

handlePreviousPage() {
    if (this.pageNumber > 1) {
        --this.pageNumber;
            this.candidates = this.mappedCandidates.slice(
            (this.pageNumber - 1) * this.pageSize,
            this.pageNumber * this.pageSize
            );
      //  refreshApex(this.wiredCandidates);
                  this.isNextDisabled = this.candidates.length < this.pageSize;
            console.log('waaaaaa',this.mappedCandidates.length < this.pageSize);
           this.isPrevDisabled = this.pageNumber === 1;
    }
}


handleUnderscoredNextPage(){
    const totalPages = Math.ceil(this.mappedCandidates.filter(e=>e.Status__c==='Underscored'|e.Status__c==='Resume reviewed').length / this.pageSize);
    if (this.underscoredPageNumber <= totalPages) {
        ++this.underscoredPageNumber;
        // Call the wired function again to fetch data for the next page
            this.underscoredCandidates = this.mappedCandidates.filter(e=>e.Status__c==='Underscored'|e.Status__c==='Resume reviewed').slice(
            (this.underscoredPageNumber - 1) * this.underscoredPageSize,
            this.underscoredPageNumber * this.underscoredPageSize
            );

     //   refreshApex(this.wiredCandidates);
            this.underscoredIsNextDisabled = this.underscoredCandidates.length < this.underscoredPageSize;
            this.underscoredIsPrevDisabled = this.underscoredPageNumber === 1;
    }
}
handleUnderscoredPreviousPage(){
        if (this.underscoredPageNumber > 1) {
        --this.underscoredPageNumber;
            this.underscoredCandidates = this.mappedCandidates.filter(e=>e.Status__c==='Underscored'|e.Status__c==='Resume reviewed').slice(
            (this.underscoredPageNumber - 1) * this.underscoredPageSize,
            this.underscoredPageNumber * this.underscoredPageSize
            );
      //  refreshApex(this.wiredCandidates);
                  this.underscoredIsNextDisabled = this.underscoredCandidates.length < this.underscoredPageSize;
            console.log('waaaaaa',this.mappedCandidates.length < this.underscoredPageSize);
           this.underscoredIsPrevDisabled = this.underscoredPageNumber === 1;
    }
}

}