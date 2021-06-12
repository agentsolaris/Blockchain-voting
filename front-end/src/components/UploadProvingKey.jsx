import React from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {setProvingKey} from '../cli.js'


export default function UploadProvingKey(props) {
    const [provingKeyUploaded, setProvingKeyUploaded] = React.useState(false);
    function helpText(){
        return "You need to upload the proving key binary file that you were provided"
    }
    function onChange(event) {
        var file = event.target.files[0];
      
        if (file) {
          var reader = new FileReader();
      
          reader.onload = function (evt) {
            setProvingKey(evt.target.result)
            //let ui32 = new Uint32Array(evt.target.result);
            //console.log(ui32.byteLength);
            setProvingKeyUploaded(true);
            localStorage.setItem('provingKeyUploaded', true);
            props.handler(true);
          };
      
          reader.onerror = function (evt) {
            console.error("An error ocurred reading the file",evt);
          };
      
          reader.readAsArrayBuffer(file);
        }
      }

  return (
    <React.Fragment>
        <Typography>{helpText()}</Typography>
        {!provingKeyUploaded ? 
        <Button variant="contained" component="label">
            Upload
            <input type="file" onChange={onChange}  hidden />
        </Button>
        : 
        <Button variant="contained"  disabled>
            Uploaded
        </Button>}

        {/* <Button variant="contained" component="label">
            Upload
            <input type="file" onChange={onChange}  hidden />
        </Button> */}
    </React.Fragment>
  );
}
